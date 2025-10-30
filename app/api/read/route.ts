import { NextResponse } from 'next/server';
import { getToken, validateToken, requestOboToken } from '@navikt/oasis';

export async function GET(request: Request) {
    const apiUrl = process.env.NODE_ENV === 'production'
        ? 'https://strim-backend.intern.nav.no/events'
        : 'http://localhost:8080/events';


        let token: string | null;
        if (process.env.NODE_ENV === 'production') {
            token = getToken(request);
            if (!token) {
                return NextResponse.json({error: 'Missing token'}, {status: 401});
            }

            const validation = await validateToken(token);
            if (!validation.ok) {
                return NextResponse.json({error: 'Token validation failed'}, {status: 401});
            }

            const obo = await requestOboToken(token, 'api://prod-gcp.team-researchops.skup-backend/.default');
            if (!obo.ok) {
                return NextResponse.json({error: 'OBO token request failed'}, {status: 401});
            }

            // token = obo.token;
        } else {
            // token = 'placeholder-token';
        }

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            console.error('Network response was not ok:', response.status, errorDetails);
            return NextResponse.json({error: 'Fetch failed', message: "Network response was not ok:"}, {status: 500});
        }

        const data = await response.json();
        return NextResponse.json(data);
}