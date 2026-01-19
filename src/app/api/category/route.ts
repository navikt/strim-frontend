import { NextResponse } from "next/server";
import { getToken, validateToken, requestOboToken } from "@navikt/oasis";

export async function GET(request: Request) {
    const apiUrl =
        process.env.NODE_ENV === "production"
            ? "http://strim-backend/categories"
            : "http://localhost:8080/categories";

    console.log(`Fetching categories from API URL: ${apiUrl}`);

    try {
        let token: string | null;

        if (process.env.NODE_ENV === "production") {
            token = getToken(request);
            if (!token) {
                console.error("Missing token from request");
                return NextResponse.json(
                    { error: "Missing token" },
                    { status: 401 },
                );
            }

            const validation = await validateToken(token);
            if (!validation.ok) {
                console.error("Token validation failed", validation.error);
                return NextResponse.json(
                    { error: "Token validation failed" },
                    { status: 401 },
                );
            }

            const cluster = process.env.NAIS_CLUSTER_NAME ?? "dev-gcp";
            const audience = `api://${cluster}.delta.strim-backend/.default`;
            console.log(`Requesting OBO token for audience: ${audience}`);

            const obo = await requestOboToken(token, audience);
            if (!obo.ok) {
                console.error("OBO token request failed", obo.error);
                return NextResponse.json(
                    { error: "OBO token request failed" },
                    { status: 401 },
                );
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
            const body = await response.text();
            console.error("Backend responded with error when fetching categories", {
                status: response.status,
                body,
            });

            return NextResponse.json(
                {
                    error: "Backend responded with error when fetching categories",
                    status: response.status,
                    body,
                },
                { status: response.status },
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error calling backend /categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories from backend" },
            { status: 500 },
        );
    }
}
