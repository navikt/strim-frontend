import { NextResponse } from "next/server";
import { getToken, validateToken, requestOboToken } from "@navikt/oasis";

export async function GET(
    request: Request,
    { params }: { params: { id: string } | Promise<{ id: string }> },
) {
    const { id } = await params;

    const apiUrl =
        process.env.NODE_ENV === "production"
            ? `http://strim-backend/events/${id}`
            : `http://localhost:8080/events/${id}`;

    try {
        let token: string | null;

        if (process.env.NODE_ENV === "production") {
            const cookie = request.headers.get("cookie") ?? "";
            const authorization = request.headers.get("authorization") ?? "";

            console.log("API /api/read/[id] called. Has cookie?", cookie.length > 0, "Has auth?", !!authorization);

            const reqForToken = new Request(request.url, {
                headers: request.headers,
            });

            token = getToken(reqForToken);
            if (!token) {
                console.error("Missing token from request (prod). Cookie length:", cookie.length);
                return NextResponse.json({ error: "Missing token" }, { status: 401 });
            }

            const validation = await validateToken(token);
            if (!validation.ok) {
                console.error("Token validation failed", validation.error);
                return NextResponse.json({ error: "Token validation failed" }, { status: 401 });
            }

            const cluster = process.env.NAIS_CLUSTER_NAME ?? "dev-gcp";
            const audience = `api://${cluster}.delta.strim-backend/.default`;

            const obo = await requestOboToken(token, audience);
            if (!obo.ok) {
                console.error("OBO token request failed", obo.error);
                return NextResponse.json({ error: "OBO token request failed" }, { status: 401 });
            }

            token = obo.token;
        } else {
            token = "placeholder-token";
        }

        const response = await fetch(apiUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const body = await response.text().catch(() => "");
            console.error("Backend responded with error", { status: response.status, body });
            return NextResponse.json(
                { error: "Backend responded with error", status: response.status, body },
                { status: response.status },
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Failed to call backend", error);
        return NextResponse.json({ error: "Failed to call backend" }, { status: 500 });
    }
}
