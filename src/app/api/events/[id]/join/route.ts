import { NextResponse } from "next/server";
import { getToken, validateToken, requestOboToken } from "@navikt/oasis";
import { logger } from "@navikt/next-logger";

async function getBackendToken(request: Request, reqId: string, logPrefix: string) {
    if (process.env.NODE_ENV !== "production") {
        logger.info(`${logPrefix} (${reqId}) dev mode: using placeholder token`);
        return "placeholder-token";
    }

    let token = getToken(request);
    if (!token) {
        return null;
    }

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

async function forward(
    request: Request,
    id: string,
    method: "POST" | "DELETE",
) {
    const reqId =
        (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();

    const logPrefix = `[api/events/${id}/join ${method}]`;

    const apiUrl =
        process.env.NODE_ENV === "production"
            ? `http://strim-backend/events/${id}/join`
            : `http://localhost:8080/events/${id}/join`;

    try {
        const token = await getBackendToken(request, reqId, logPrefix);
        if (!token) {
            logger.warn(`${logPrefix} (${reqId}) Missing/invalid token`);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const response = await fetch(apiUrl, {
            method,
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

export async function POST(
    request: Request,
    { params }: { params: { id: string } | Promise<{ id: string }> },
) {
    const { id } = await params;
    return forward(request, id, "POST");
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } | Promise<{ id: string }> },
) {
    const { id } = await params;
    return forward(request, id, "DELETE");
}
