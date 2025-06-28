import { NextResponse } from 'next/server';
import { getToken, validateToken, requestOboToken, parseAzureUserToken } from '@navikt/oasis';

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

        const obo = await requestOboToken(token, 'api://prod-gcp.team-researchops.skup-backend/.default');
        if (!obo.ok) {
            return NextResponse.json({ error: 'OBO token request failed' }, { status: 401 });
        }

        const parse = parseAzureUserToken(token);
        if (parse.ok) {
            console.log(`Bruker: ${parse.preferred_username} (${parse.NAVident})`);
        }

        return NextResponse.json({ message: 'User information printed successfully' });
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