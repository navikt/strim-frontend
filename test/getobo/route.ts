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

        const obo = await requestOboToken(token, 'api://prod-gcp.team-researchops.skup/.default');
        if (!obo.ok) {
            return NextResponse.json({ error: 'OBO token request failed' }, { status: 401 });
        }

        console.log('OBO Token:', obo.token);
        return NextResponse.json({ oboToken: obo.token });
    } catch (error) {
        if (error instanceof Error) {
            console.error('Fetch failed:', error.message, error.stack);
            return NextResponse.json({ error: 'Fetch failed', message: error.message, stack: error.stack }, { status: 500 });
        } else {
            console.error('An unknown error occurred');
            return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
        }
    }
}