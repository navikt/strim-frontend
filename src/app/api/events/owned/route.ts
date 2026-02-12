import { NextResponse } from "next/server";
import { getToken, validateToken, requestOboToken } from "@navikt/oasis";
import { logger } from "@navikt/next-logger";

async function getBackendToken(request: Request, reqId: string, logPrefix: string) {
    if (process.env.NODE_ENV !== "production") {
        logger.info(`${logPrefix} (${reqId}) dev mode: using placeholder token`);
        return "placeholder-token";
    }

    const token = getToken(request);
    if (!token) return null;

    const validation = await validateToken(token);
    if (!validation.ok) {
        logger.error(`${logPrefix} (${reqId}) Token validation failed`);
        return null;
    }

    const cluster = process.env.NAIS_CLUSTER_NAME ?? "dev-gcp";
    const audience = `api://${cluster}.delta.strim-backend/.default`;

    const obo = await requestOboToken(token, audience);
    if (!obo.ok) {
        logger.error(`${logPrefix} (${reqId}) OBO token request failed`);
        return null;
    }

    return obo.token;
}

export async function GET(request: Request) {
    const reqId =
        (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();

    const logPrefix = `[api/events/owned GET]`;

    const apiUrl =
        process.env.NODE_ENV === "production"
            ? `http://strim-backend/events/owned`
            : `http://localhost:8080/events/owned`;

    try {
        const token = await getBackendToken(request, reqId, logPrefix);
        if (!token) {
            logger.warn(`${logPrefix} (${reqId}) Missing/invalid token`);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const body = await response.text().catch(() => "");
            return NextResponse.json(
                { error: "Backend responded with error", status: response.status, body },
                { status: response.status },
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (err) {
        logger.error(`${logPrefix} (${reqId}) ERROR`);
        return NextResponse.json({ error: "Failed to call backend" }, { status: 500 });
    } finally {
        logger.info(`${logPrefix} (${reqId}) END`);
    }
}
