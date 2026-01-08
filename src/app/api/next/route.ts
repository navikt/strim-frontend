import { NextResponse } from "next/server";
import { getToken, validateToken, requestOboToken } from "@navikt/oasis";

export async function GET(request: Request) {
    const apiUrl =
        process.env.NODE_ENV === "production"
            ? "http://strim-backend/events/next"
            : "http://localhost:8080/events/next";

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

        const res = await fetch(apiUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (res.status === 404) return NextResponse.json(null);

        if (!res.ok) {
            const body = await res.text().catch(() => "");
            return NextResponse.json({ error: "Backend error", status: res.status, body }, { status: res.status });
        }

        return NextResponse.json(await res.json());
    } catch {
        return NextResponse.json({ error: "Failed to call backend" }, { status: 500 });
    }
}
