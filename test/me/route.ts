import { NextResponse } from 'next/server';
import { getToken, validateToken, parseAzureUserToken } from '@navikt/oasis';

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

        const parse = parseAzureUserToken(token);
        if (parse.ok) {
            return NextResponse.json({ user: parse });
        } else {
            return NextResponse.json({ error: 'User token parsing failed' }, { status: 401 });
        }
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