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
            token = getToken(request);
            if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

            const validation = await validateToken(token);
            if (!validation.ok) return NextResponse.json({ error: "Token validation failed" }, { status: 401 });

            const cluster = process.env.NAIS_CLUSTER_NAME ?? "dev-gcp";
            const audience = `api://${cluster}.delta.strim-backend/.default`;

            const obo = await requestOboToken(token, audience);
            if (!obo.ok) return NextResponse.json({ error: "OBO token request failed" }, { status: 401 });

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
            return NextResponse.json(
                { error: "Backend responded with error", status: response.status, body },
                { status: response.status },
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Failed to call backend" }, { status: 500 });
    }
}
