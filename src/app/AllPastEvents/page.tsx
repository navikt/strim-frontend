"use client";

import { useEffect, useState } from "react";
import EventRow, { EventDto } from "@/app/components/event/eventKort";
import {getFaro, initInstrumentation, pinoLevelToFaroLevel,} from "@/faro/faro";
import { configureLogger } from "@navikt/next-logger";
import {Button} from "@navikt/ds-react";
import Link from "next/link";
import {ArrowLeftIcon} from "@navikt/aksel-icons";

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
    const [pastEvents, setPastEvents] = useState<Event[]>([]);
    const [error, setError] = useState<string | null>(null);

    initInstrumentation();
    configureLogger({
        basePath: process.env.NEXT_PUBLIC_BASE_PATH,
        onLog: (log) =>
            getFaro().api.pushLog(log.messages, {
                level: pinoLevelToFaroLevel(log.level.label),
            }),
    });

    const fetchEvents = async () => {
        try {
            const [pastRes] = await Promise.all([
                fetch("/api/past")
            ]);

            if (!pastRes.ok) {
                console.error("Network error", pastRes.status);
                setError("En feil oppstod ved henting av arrangementer");
                return;
            }

            const pastData: Event[] = await pastRes.json();

            setPastEvents(pastData);
        } catch (e) {
            console.error("Error fetching events:", e);
            setError("En ukjent feil oppstod");
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    return (
        <div className="container mx-auto pt-6 pb-12 space-y-12">
            {error && <p className="text-red-500">{error}</p>}

            <section>
                <div className="flex justify-start">
                    <div className="mb-4">
                        <Button as={Link} href="/" variant="secondary" icon={<ArrowLeftIcon aria-hidden />}>
                            Tilbake
                        </Button>
                    </div>
                </div>

                <div className="flex items-baseline justify-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold text-center">Alle Kommende møter</h2>
                </div>

                {pastEvents.length === 0 ? (
                    <p>Ingen flere kommende møter.</p>
                ) : (
                    <ul className="grid gap-6 md:grid-cols-2">
                        {pastEvents.map((e) => (
                            <EventRow key={e.id} event={e as unknown as EventDto} />
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
