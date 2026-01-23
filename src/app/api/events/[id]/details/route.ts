import { NextResponse } from "next/server";
import { getToken, validateToken, requestOboToken } from "@navikt/oasis";
import { logger } from "@navikt/next-logger";

export async function GET(
    request: Request,
    { params }: { params: { id: string } | Promise<{ id: string }> },
) {
    const { id } = await params;

    const reqId =
        (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();

    const apiUrl =
        process.env.NODE_ENV === "production"
            ? `http://strim-backend/events/${id}/details`
            : `http://localhost:8080/events/${id}/details`;

    try {
        let token: string | null;

        if (process.env.NODE_ENV === "production") {
            token = getToken(request);

            if (!token) {
                logger.warn(`[api/events/${id}/details] (${reqId}) Missing token (getToken returned null)`);
                return NextResponse.json({ error: "Missing token" }, { status: 401 });
            }

            const validation = await validateToken(token);

            if (!validation.ok) {
                logger.error(
                    `[api/events/${id}/details] (${reqId}) Token validation failed`,
                );
                return NextResponse.json({ error: "Token validation failed" }, { status: 401 });
            }

            const cluster = process.env.NAIS_CLUSTER_NAME ?? "dev-gcp";
            const audience = `api://${cluster}.delta.strim-backend/.default`;

            const obo = await requestOboToken(token, audience);

            if (!obo.ok) {
                logger.error(`[api/events/${id}/details] (${reqId}) OBO token request failed`);
                return NextResponse.json({ error: "OBO token request failed" }, { status: 401 });
            }

            token = obo.token;
        } else {
            token = "placeholder-token";
            logger.info(`[api/events/${id}/details] (${reqId}) dev mode: using placeholder token`);
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
        logger.error(`[api/events/${id}/details] (${reqId}) ERROR`);
        return NextResponse.json({ error: "Failed to call backend" }, { status: 500 });
    } finally {
        logger.info(`[api/events/${id}/details] (${reqId}) END`);
    }
}
