"use client";
import { useEffect, useState } from "react";
import EventRow, { EventDto } from "@/app/components/event/eventKort";
import {getFaro, initInstrumentation, pinoLevelToFaroLevel} from "@/faro/faro";
import {configureLogger} from '@navikt/next-logger'

interface Event {
    id: string;
    title: string;
    description: string;
    imageUrl: string | null;
    startTime: string;
    endTime: string;
    location: string;
    isPublic: boolean;
    participantLimit: number;
    signupDeadline: string | null;
}

export default function MainSection() {
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [pastEvents, setPastEvents] = useState<Event[]>([]);
    const [error, setError] = useState<string | null>(null);

    initInstrumentation()
    configureLogger({
        basePath: process.env.NEXT_PUBLIC_BASE_PATH,
        onLog: (log) =>
            getFaro().api.pushLog(log.messages, {
                level: pinoLevelToFaroLevel(log.level.label),
            }),
    })

    const fetchEvents = async () => {
        try {
            const [upcomingRes, pastRes] = await Promise.all([
                fetch("/api/upcoming"),
                fetch("/api/past"),
            ]);

            if (!upcomingRes.ok || !pastRes.ok) {
                console.error("Network error", upcomingRes.status, pastRes.status);
                setError("En feil oppstod ved henting av arrangementer");
                return;
            }

            const upcomingData: Event[] = await upcomingRes.json();
            const pastData: Event[] = await pastRes.json();

            setUpcomingEvents(upcomingData);
            setPastEvents(pastData);
        } catch (e) {
            console.error("Error fetching events:", e);
            setError("En ukjent feil oppstod");
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const nextEvent = upcomingEvents[0] ?? null;
    const restUpcoming = upcomingEvents.slice(1);

    const displayedRestUpcoming = restUpcoming.slice(0, 4);
    const displayedPastEvents = pastEvents.slice(0, 4);

    return (
        <div className="container mx-auto pt-6 pb-12 space-y-12">
            {error && <p className="text-red-500">{error}</p>}

            <section>
                <h1 className="text-3xl font-bold text-center mb-6">Strim for Nav</h1>
                <h2 className="text-xl font-semibold text-center mb-6">Neste møte</h2>

                {!nextEvent ? (
                    <p className="text-center">Ingen kommende møter.</p>
                ) : (
                    <ul>
                        <EventRow event={nextEvent as unknown as EventDto} />
                    </ul>
                )}
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4">Kommende møter</h2>

                {restUpcoming.length === 0 ? (
                    <p>Ingen flere kommende møter.</p>
                ) : (
                    <ul className="grid gap-6 md:grid-cols-2">
                        {displayedRestUpcoming.map((e) => (
                            <EventRow key={e.id} event={e as unknown as EventDto} />
                        ))}
                    </ul>
                )}
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Tidligere møter</h2>

                {pastEvents.length === 0 ? (
                    <p>Ingen tidligere møter.</p>
                ) : (
                    <ul className="grid gap-6 md:grid-cols-2">
                        {displayedPastEvents.map((e) => (
                            <EventRow key={e.id} event={e as unknown as EventDto} />
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
