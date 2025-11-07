import { NextResponse } from 'next/server';
import { getToken, validateToken, requestOboToken } from '@navikt/oasis';

export async function GET(request: Request) {
    const apiUrl = process.env.NODE_ENV === 'production'
        ? 'https://strim-backend.intern.nav.no/events'
        : 'http://localhost:8080/events';

    try {
        let token: string | null;
        if (process.env.NODE_ENV === 'production') {
            token = getToken(request);
            if (!token) {
                return NextResponse.json({ error: 'Missing token' }, { status: 401 });
            }

            const validation = await validateToken(token);
            if (!validation.ok) {
                return NextResponse.json({ error: 'Token validation failed' }, { status: 401 });
            }

            console.debug('Incoming token length:', token.length);

            const scope = process.env.OBO_API_AUDIENCE || 'api://prod-gcp.team-researchops.skup-backend/.default';
            const obo = await requestOboToken(token, scope);

            if (!obo.ok) {
                console.error('OBO token request failed:', obo);
                const safeDetail =
                    (obo as any).error_description ||
                    (obo as any).error ||
                    (obo as any).message ||
                    'OBO request failed (see server logs)';

                if ((obo as any).error === 'invalid_resource') {
                    return NextResponse.json({
                        error: 'OBO token request failed',
                        detail: safeDetail,
                        hint: 'invalid_resource: check that the Application ID URI / audience exists in this tenant and that the client app has permission and consent.'
                    }, { status: 401 });
                }

                return NextResponse.json({ error: 'OBO token request failed', detail: safeDetail }, { status: 401 });
            }

            token = (obo as any).token;
        } else {
            token = 'placeholder-token';
        }

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            console.error('Network response was not ok:', response.status, errorDetails);
            throw new Error(`Network response was not ok: ${response.status} - ${errorDetails}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        if (error instanceof Error) {
            console.error('Fetch failed:', error.message, error.stack);
            return NextResponse.json({ error: 'Fetch failed', message: error.message }, { status: 500 });
        } else {
            console.error('An unknown error occurred');
            return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
        }
    }
}