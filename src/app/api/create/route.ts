import { NextResponse } from 'next/server';
import { getToken, validateToken, requestOboToken } from '@navikt/oasis';

export async function POST(request: Request) {
    const apiUrl = process.env.NODE_ENV === 'production'
        ? 'http://strim-backend/events/create'
        : 'http://localhost:8080/events/create';

    try {
        let token: string | null;
        if (process.env.NODE_ENV === 'production') {
            token = getToken(request);
            if (!token) {
                return NextResponse.json({ detail: 'Mangler token' }, { status: 401 });
            }

            const validation = await validateToken(token);
            if (!validation.ok) {
                return NextResponse.json({ detail: 'Token validering feilet' }, { status: 401 });
            }

            const cluster = process.env.NAIS_CLUSTER_NAME ?? 'dev-gcp';
            const audience = `api://${cluster}.delta.strim-backend/.default`;

            const obo = await requestOboToken(token, audience);
            if (!obo.ok) {
                return NextResponse.json({ detail: 'OBO token forespørsel feilet' }, { status: 401 });
            }

            token = obo.token;
        } else {
            token = 'placeholder-token';
        }

        const eventData = await request.json();

        console.log("Sending event payload to backend:", eventData);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(eventData)
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            console.error('Error posting event:', response.status, errorDetails);
            return NextResponse.json({ detail: `Feil ved innsending: ${response.status}`, errorDetails }, { status: response.status });
        }

        const data = await response.json();
        console.log("Event successfully created:", data);
        return NextResponse.json(data);

    } catch (error) {
        console.error("POST /api/events/create crashed:", error);
        return NextResponse.json({ detail: 'Serverfeil' }, { status: 500 });
    }
}
