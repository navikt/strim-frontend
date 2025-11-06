import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('app_id');

    if (!appId) {
        return NextResponse.json({ error: 'App ID is required' }, { status: 400 });
    }

    const apiUrl = process.env.NODE_ENV === 'production'
        ? `http://skup-backend/api/apps/${appId}`
        : `https://skupapi.intern.nav.no/api/apps/${appId}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer kinda-clever-token',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Network response was not ok:', response.status, errorData.detail || 'An unknown error occurred');
            throw new Error(errorData.detail || 'An unknown error occurred');
        }

        return NextResponse.json({ message: 'App deleted successfully' });
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