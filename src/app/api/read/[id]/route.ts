import { NextResponse } from "next/server";
import { getToken, validateToken, requestOboToken } from "@navikt/oasis";
import { logger } from '@navikt/next-logger'

export async function GET(
    request: Request,
    { params }: { params: { id: string } | Promise<{ id: string }> },
) {
    const { id } = await params;

    const reqId =
        (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();

    const apiUrl =
        process.env.NODE_ENV === "production"
            ? `http://strim-backend/events/${id}`
            : `http://localhost:8080/events/${id}`;

    try {
        let token: string | null;

        if (process.env.NODE_ENV === "production") {
            token = getToken(request);

            if (!token) {
                console.warn(`[api/read/${id}] (${reqId}) Missing token (getToken returned null)`);
                return NextResponse.json({ error: "Missing token" }, { status: 401 });
            }

            const validation = await validateToken(token);

            if (!validation.ok) {
                console.error(
                    `[api/read/${id}] (${reqId}) Token validation failed`,
                    validation.error,
                );
                return NextResponse.json({ error: "Token validation failed" }, { status: 401 });
            }

            const cluster = process.env.NAIS_CLUSTER_NAME ?? "dev-gcp";
            const audience = `api://${cluster}.delta.strim-backend/.default`;

            const obo = await requestOboToken(token, audience);

            if (!obo.ok) {
                logger.error(`[api/read/${id}] (${reqId}) OBO token request failed`);
                return NextResponse.json({ error: "OBO token request failed" }, { status: 401 });

            }

            token = obo.token;
        } else {
            token = "placeholder-token";
            logger.info(`[api/read/${id}] (${reqId}) dev mode: using placeholder token`);
        }

        const response = await fetch(apiUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
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
        console.error(`[api/read/${id}] (${reqId}) ERROR`, err);
        return NextResponse.json({ error: "Failed to call backend" }, { status: 500 });
    } finally {
        console.log(`[api/read/${id}] (${reqId}) END`);
    }
}
