import { NextResponse } from 'next/server';
import { getToken, validateToken, requestOboToken } from '@navikt/oasis';

export async function POST(request: Request) {
    const apiUrl = process.env.NODE_ENV === 'production'
        ? 'http://skup-backend/api/apps'
        : 'http://0.0.0.0:8086/api/apps';

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

            const obo = await requestOboToken(token, 'api://prod-gcp.team-researchops.skup-backend/.default');
            if (!obo.ok) {
                return NextResponse.json({ detail: 'OBO token forespørsel feilet' }, { status: 401 });
            }

            token = obo.token;
        } else {
            token = 'placeholder-token';
        }

        const appData = await request.json();
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(appData),
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error('Nettverksresponsen var ikke ok:', response.status, errorDetails);
            return NextResponse.json({ detail: errorDetails.detail || `Nettverksresponsen var ikke ok: ${response.status}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        if (error instanceof Error) {
            console.error('Henting feilet:', error.message, error.stack);
            return NextResponse.json({ detail: 'Henting feilet' }, { status: 500 });
        } else {
            console.error('En ukjent feil oppstod');
            return NextResponse.json({ detail: 'En ukjent feil oppstod' }, { status: 500 });
        }
    }
}