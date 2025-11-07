import { NextResponse } from 'next/server';
import { getToken, validateToken, requestOboToken } from '@navikt/oasis';

export async function GET(request: Request) {
    try {
        const token = getToken(request);
        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 401 });
        }

        const validation = await validateToken(token);
        if (!validation.ok) {
            return NextResponse.json({ error: 'Token validation failed' }, { status: 401 });
        }

        const scope = process.env.OBO_API_AUDIENCE || 'api://prod-gcp.team-researchops.skup/.default';
        const obo = await requestOboToken(token, scope);

        if (!obo.ok) {
            console.error('OBO token request failed:', obo);
            const safeDetail = (obo as any).error_description || (obo as any).error || 'OBO request failed (see server logs)';
            const payload: any = { error: 'OBO token request failed', detail: safeDetail };
            if ((obo as any).error === 'invalid_resource') {
                payload.hint = 'invalid_resource: check Application ID URI / audience, tenant, and consent for this API.';
            }
            return NextResponse.json(payload, { status: 401 });
        }

        // Do NOT log the token itself; only indicate success
        console.debug('OBO token acquired, length:', (obo as any).token?.length || 0);
        return NextResponse.json({ oboToken: (obo as any).token });
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