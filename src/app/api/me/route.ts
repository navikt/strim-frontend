import { NextResponse } from "next/server";
import { getToken, validateToken } from "@navikt/oasis";
import { logger } from "@navikt/next-logger";

export async function GET(request: Request) {
    const reqId =
        (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();

    try {
        if (process.env.NODE_ENV !== "production") {
            return NextResponse.json({ email: "test@localhost", name: "Test User" });
        }

        const token = getToken(request);
        if (!token) {
            return NextResponse.json({ error: "Missing token" }, { status: 401 });
        }

        const validation = await validateToken(token);
        if (!validation.ok) {
            logger.error(`[api/me] (${reqId}) Token validation failed`);
            return NextResponse.json({ error: "Token validation failed" }, { status: 401 });
        }
        const claims: Record<string, unknown> = (validation as any).claims ?? (validation as any).payload ?? {};

        const claim = (key: string) => {
            const v = claims?.[key];
            if (v == null) return null;
            const s = String(v).trim();
            return s.length ? s : null;
        };

        const email =
            (claim("preferred_username") ?? claim("upn") ?? claim("email") ?? claim("sub") ?? "").toLowerCase();

        const name = claim("name") ?? claim("given_name") ?? email;

        if (!email) {
            return NextResponse.json({ error: "Could not resolve user identity" }, { status: 500 });
        }

        return NextResponse.json({ email, name });
    } catch (err) {
        logger.error(`[api/me] (${reqId}) ERROR`);
        return NextResponse.json({ error: "Failed to resolve user" }, { status: 500 });
    }
}
