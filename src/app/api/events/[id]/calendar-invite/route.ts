import { NextResponse } from 'next/server';
import { getToken, validateToken, requestOboToken } from '@navikt/oasis';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const eventId = params.id;

    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? `http://strim-backend/events/${eventId}/calendar-invite`
            : `http://localhost:8080/events/${eventId}/calendar-invite`;

    try {
        let token: string | null;

        if (process.env.NODE_ENV === 'production') {
            token = getToken(request);
            if (!token) {
                return NextResponse.json(
                    { detail: 'Mangler token' },
                    { status: 401 }
                );
            }

            const validation = await validateToken(token);
            if (!validation.ok) {
                return NextResponse.json(
                    { detail: 'Token validering feilet' },
                    { status: 401 }
                );
            }

            const cluster = process.env.NAIS_CLUSTER_NAME ?? 'dev-gcp';
            const audience = `api://${cluster}.delta.strim-backend/.default`;

            const obo = await requestOboToken(token, audience);
            if (!obo.ok) {
                return NextResponse.json(
                    { detail: 'OBO token forespørsel feilet' },
                    { status: 401 }
                );
            }

            token = obo.token;
        } else {
            token = 'placeholder-token';
        }

        console.log(`Sending calendar invite request for event ${eventId}`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            let errorBody: unknown;

            const contentType = response.headers.get('content-type') ?? '';
            if (contentType.includes('application/json')) {
                errorBody = await response.json();
            } else {
                const text = await response.text();
                errorBody = { message: text };
            }

            console.error(
                'Error sending calendar invite:',
                response.status,
                errorBody
            );

            return NextResponse.json(
                {
                    detail: `Feil ved sending av kalenderinvitasjon: ${response.status}`,
                    errors: errorBody,
                },
                { status: response.status }
            );
        }

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error(
            'POST /api/events/[id]/calendar-invite crashed:',
            error
        );
        return NextResponse.json(
            { detail: 'Serverfeil' },
            { status: 500 }
        );
    }
}
