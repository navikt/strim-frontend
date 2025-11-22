import { NextResponse } from 'next/server';
import { getToken, validateToken, requestOboToken } from '@navikt/oasis';

export async function GET(request: Request) {
    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? 'http://strim-backend/events/past'
            : 'http://localhost:8080/events/past';

    console.log(`Fetching PAST events from API URL: ${apiUrl}`);

    try {
        let token: string | null;

        if (process.env.NODE_ENV === 'production') {
            token = getToken(request);
            if (!token) {
                console.error('Missing token from request');
                return NextResponse.json({ error: 'Missing token' }, { status: 401 });
            }

            const validation = await validateToken(token);
            if (!validation.ok) {
                console.error('Token validation failed', validation.error);
                return NextResponse.json({ error: 'Token validation failed' }, { status: 401 });
            }

            const cluster = process.env.NAIS_CLUSTER_NAME ?? 'dev-gcp';
            const audience = `api://${cluster}.delta.strim-backend/.default`;
            console.log(`Requesting OBO token for audience: ${audience}`);

            const obo = await requestOboToken(token, audience);
            if (!obo.ok) {
                console.error('OBO token exchange failed', {
                    error: obo.error,
                    error_description: obo.error,
                });
                return NextResponse.json(
                    { error: 'OBO token request failed' },
                    { status: 401 },
                );
            }

            token = obo.token;
        } else {
            token = 'placeholder-token';
        }

        const response = await fetch(apiUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const body = await response.text();
            console.error('Backend responded with error (past)', {
                status: response.status,
                body,
            });

            return NextResponse.json(
                {
                    error: 'Backend responded with error',
                    status: response.status,
                    body,
                },
                { status: response.status },
            );
        }

        const data = await response.json();
        console.log('Backend PAST events response:', JSON.stringify(data, null, 2));

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error calling backend /events/past:', error);
        return NextResponse.json(
            { error: 'Failed to call backend' },
            { status: 500 },
        );
    }
}
