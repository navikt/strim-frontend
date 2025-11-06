import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const apiUrl = process.env.NODE_ENV === 'production'
        ? 'http://skup-backend/api/apps'
        : 'https://skupapi.intern.nav.no/api/apps';

    try {
        const appData = await request.json();
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer kinda-clever-token',
            },
            body: JSON.stringify(appData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Upstream error:', response.status, errorData.detail || errorData.message || 'An unknown error occurred');

            return NextResponse.json(
                { error: errorData.detail || errorData.message || 'An unknown error occurred' },
                { status: response.status || 500 }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        if (error instanceof Error) {
            console.error('Fetch failed:', error.message);
            const body: Record<string, unknown> = { error: 'Fetch failed', message: error.message };
            if (process.env.NODE_ENV !== 'production') {
                body.stack = error.stack;
            }
            return NextResponse.json(body, { status: 500 });
        } else {
            console.error('An unknown error occurred');
            return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
        }
    }
}