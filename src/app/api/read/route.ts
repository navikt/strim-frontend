import {NextResponse} from 'next/server';
import {getToken, requestOboToken, validateToken} from '@navikt/oasis';

export async function GET(request: Request) {
    const isProd = process.env.NODE_ENV === 'production';
    const apiUrl = isProd
        ? 'https://strim-backend.intern.nav.no/events'
        : 'http://localhost:8080/events';
    try {
        let token: string;
        if (isProd) {
            // 1. Get user token from Wonderwall / request
            const incomingToken = getToken(request);
            if (!incomingToken) {
                console.error('Missing incoming token from request');
                return NextResponse.json(
                    {error: 'Missing token'},
                    {status: 401},
                );
            }
            const validation = await validateToken(incomingToken);
            if (!validation.ok) {
                console.error('Token validation failed', validation);
                return NextResponse.json(
                    {error: 'Token validation failed'},
                    {status: 401},
                );
            }

            console.debug('Incoming token length:', incomingToken.length);
            const scope = process.env.OBO_API_AUDIENCE;
            if (!scope) {
                console.error('OBO_API_AUDIENCE is not set in environment');
                return NextResponse.json(
                    {
                        error: 'Server misconfigured',
                        detail:
                            'OBO_API_AUDIENCE is not set. Expected something like api://prod-gcp.team-researchops.strim-backend/.default',
                    },
                    {status: 500},
                );
            }
            const obo = await requestOboToken(incomingToken, scope);
            if (!obo.ok) {
                console.error('OBO token request failed:', obo);
                const safeDetail =
                    (obo as any).error_description ||
                    (obo as any).error ||
                    (obo as any).message ||
                    'OBO request failed (see server logs)';

                if ((obo as any).error === 'invalid_resource') {
                    return NextResponse.json(
                        {
                            error: 'OBO token request failed',
                            detail: safeDetail,
                            hint: 'invalid_resource: check that the Application ID URI / audience exists in this tenant and that the client app has permission and consent.',
                        },
                        {status: 401},
                    );
                }

                return NextResponse.json(
                    {
                        error: 'OBO token request failed',
                        detail: safeDetail,
                    },
                    {status: 401},
                );
            }

            token = obo.token;
        } else {
            token = 'placeholder-token';
        }
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            // avoid caching in Next/edge
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            console.error(
                'Network response was not ok:',
                response.status,
                errorDetails,
            );
            throw new Error(
                `Network response was not ok: ${response.status} - ${errorDetails}`,
            );
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        if (error instanceof Error) {
            console.error('Fetch failed:', error.message, error.stack);
            return NextResponse.json(
                {
                    error: 'Fetch failed',
                    message: error.message,
                },
                {status: 500},
            );
        } else {
            console.error('An unknown error occurred');
            return NextResponse.json(
                {error: 'An unknown error occurred'},
                {status: 500},
            );
        }
    }
}
