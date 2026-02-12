"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@navikt/ds-react";
import { ArrowLeftIcon } from "@navikt/aksel-icons";
import EventRow, { EventDto } from "@/app/components/event/eventKort";

type EventListResponse = {
    upcoming: EventDto[];
    past: EventDto[];
};

export default function MineMoterPage() {
    const [data, setData] = useState<EventListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch("/api/events/mine");
                if (!res.ok) {
                    throw new Error("Failed to fetch my events");
                }
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError("Kunne ikke hente møter");
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, []);

    return (
        <div className="container relative mx-auto pt-12 pb-12 space-y-12">
            <div className="absolute left-0 top-1">
                <Button
                    as={Link}
                    href="/"
                    variant="secondary"
                    icon={<ArrowLeftIcon aria-hidden />}
                >
                    Tilbake
                </Button>
            </div>

            <section>
                <h1 className="text-3xl font-bold mb-6">
                    Møter du er meldt på
                </h1>
            </section>

            {loading && <p>Laster...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && data && (
                <>
                    <section>
                        <div className="flex items-baseline justify-between gap-4 mb-4">
                            <h2 className="text-2xl font-bold">
                                Kommende møter
                            </h2>
                        </div>

                        {data.upcoming.length === 0 ? (
                            <p>Ingen kommende møter.</p>
                        ) : (
                            <ul className="grid gap-6 md:grid-cols-2">
                                {data.upcoming.map((event) => (
                                    <EventRow
                                        key={event.id}
                                        event={event}
                                    />
                                ))}
                            </ul>
                        )}
                    </section>

                    <section>
                        <div className="flex items-baseline justify-between gap-4 mb-4">
                            <h2 className="text-xl font-semibold">
                                Møter du har deltatt i
                            </h2>
                        </div>

                        {data.past.length === 0 ? (
                            <p>Ingen tidligere møter.</p>
                        ) : (
                            <ul className="grid gap-6 md:grid-cols-2">
                                {data.past.map((event) => (
                                    <EventRow
                                        key={event.id}
                                        event={event}
                                    />
                                ))}
                            </ul>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
