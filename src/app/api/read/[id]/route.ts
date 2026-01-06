import { NextResponse } from "next/server";
import { getToken, validateToken, requestOboToken } from "@navikt/oasis";

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

    const cookieHeader = request.headers.get("cookie");
    const authHeader = request.headers.get("authorization");

    console.log(`[api/read/${id}] (${reqId}) START`);
    console.log(
        `[api/read/${id}] (${reqId}) env=${process.env.NODE_ENV} url=${apiUrl}`,
    );
    console.log(
        `[api/read/${id}] (${reqId}) cookieHeaderPresent=${!!cookieHeader} authorizationHeaderPresent=${!!authHeader}`,
    );

    try {
        let token: string | null;

        if (process.env.NODE_ENV === "production") {
            token = getToken(request);
            console.log(`[api/read/${id}] (${reqId}) getToken() present=${!!token}`);

            if (!token) {
                console.warn(`[api/read/${id}] (${reqId}) Missing token (getToken returned null)`);
                return NextResponse.json({ error: "Missing token" }, { status: 401 });
            }

            const validation = await validateToken(token);
            console.log(`[api/read/${id}] (${reqId}) validateToken ok=${validation.ok}`);

            if (!validation.ok) {
                console.error(
                    `[api/read/${id}] (${reqId}) Token validation failed`,
                    validation.error,
                );
                return NextResponse.json({ error: "Token validation failed" }, { status: 401 });
            }

            const cluster = process.env.NAIS_CLUSTER_NAME ?? "dev-gcp";
            const audience = `api://${cluster}.delta.strim-backend/.default`;
            console.log(`[api/read/${id}] (${reqId}) audience=${audience}`);

            const obo = await requestOboToken(token, audience);
            console.log(`[api/read/${id}] (${reqId}) requestOboToken ok=${obo.ok}`);

            if (!obo.ok) {
                console.error(`[api/read/${id}] (${reqId}) OBO token request failed`, obo.error);
                return NextResponse.json({ error: "OBO token request failed" }, { status: 401 });
            }

            token = obo.token;
        } else {
            token = "placeholder-token";
            console.log(`[api/read/${id}] (${reqId}) dev mode: using placeholder token`);
        }

        console.log(`[api/read/${id}] (${reqId}) calling backend...`);

        const response = await fetch(apiUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        console.log(
            `[api/read/${id}] (${reqId}) backend status=${response.status} ok=${response.ok}`,
        );

        if (!response.ok) {
            const body = await response.text().catch(() => "");
            console.error(`[api/read/${id}] (${reqId}) Backend error body (first 500 chars):`);
            console.error(body.slice(0, 500));

            return NextResponse.json(
                { error: "Backend responded with error", status: response.status, body },
                { status: response.status },
            );
        }

        const data = await response.json();
        console.log(`[api/read/${id}] (${reqId}) SUCCESS`);
        return NextResponse.json(data);
    } catch (err) {
        console.error(`[api/read/${id}] (${reqId}) ERROR`, err);
        return NextResponse.json({ error: "Failed to call backend" }, { status: 500 });
    } finally {
        console.log(`[api/read/${id}] (${reqId}) END`);
    }
}
