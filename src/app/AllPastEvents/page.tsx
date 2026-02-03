"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@navikt/ds-react";
import { ArrowLeftIcon } from "@navikt/aksel-icons";

import EventRow, { EventDto } from "@/app/components/event/eventKort";
import type { EventDTO } from "@/types/event";
import type { CategoryDTO } from "@/types/category";

import {
    getFaro,
    initInstrumentation,
    pinoLevelToFaroLevel,
} from "@/faro/faro";
import { configureLogger } from "@navikt/next-logger";

import {
    EventFiltersModal,
    type EventFilterValue,
} from "@/app/components/eventfilter/EventFiltersModal";

function startOfDayMs(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
}

function endOfDayMs(d: Date) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x.getTime();
}

function applyFilters(events: EventDTO[], f: EventFilterValue): EventDTO[] {
    const q = f.q.trim().toLowerCase();
    const fromMs = f.fromDate ? startOfDayMs(f.fromDate) : null;
    const toMs = f.toDate ? endOfDayMs(f.toDate) : null;

    const normalize = (s: string) => s.trim().toLowerCase();

    const filtered = events.filter((e) => {
        const text = `${e.title ?? ""} ${e.description ?? ""} ${e.location ?? ""}`.toLowerCase();
        const matchesQ = !q || text.includes(q);

        const eventMs = Date.parse(e.startTime);
        const matchesFrom = fromMs === null || eventMs >= fromMs;
        const matchesTo = toMs === null || eventMs <= toMs;

        // ✅ FIX: tags can come from categoryNames OR categories[].name
        const eventTags: string[] =
            (e as any).categoryNames ??
            ((e as any).categories?.map((c: any) => c?.name).filter(Boolean) as string[]) ??
            [];

        const eventTagSet = new Set(eventTags.map(normalize));
        const matchesTags =
            f.tags.length === 0 || f.tags.every((t) => eventTagSet.has(normalize(t)));

        return matchesQ && matchesFrom && matchesTo && matchesTags;
    });

    if (!f.sort) return filtered;

    return filtered.sort((a, b) => {
        switch (f.sort) {
            case "date_asc":
                return Date.parse(a.startTime) - Date.parse(b.startTime);
            case "date_desc":
                return Date.parse(b.startTime) - Date.parse(a.startTime);
            case "title_asc":
                return a.title.localeCompare(b.title, "nb");
            case "title_desc":
                return b.title.localeCompare(a.title, "nb");
            default:
                return 0;
        }
    });
}

export default function MainSection() {
    const [pastEvents, setPastEvents] = useState<EventDTO[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [categories, setCategories] = useState<CategoryDTO[]>([]);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);

    const [filters, setFilters] = useState<EventFilterValue>({
        q: "",
        fromDate: null,
        toDate: null,
        tags: [],
        sort: "",
    });

    useEffect(() => {
        initInstrumentation();
        configureLogger({
            basePath: process.env.NEXT_PUBLIC_BASE_PATH,
            onLog: (log) =>
                getFaro().api.pushLog(log.messages, {
                    level: pinoLevelToFaroLevel(log.level.label),
                }),
        });
    }, []);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const pastRes = await fetch("/api/past");
                if (!pastRes.ok) {
                    console.error("Network error", pastRes.status);
                    setError("En feil oppstod ved henting av arrangementer");
                    return;
                }
                const pastData: EventDTO[] = await pastRes.json();
                setPastEvents(pastData);
            } catch (e) {
                console.error("Error fetching events:", e);
                setError("En ukjent feil oppstod");
            }
        };

        fetchEvents();
    }, []);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setCategoriesError(null);

                const res = await fetch("/api/category", { cache: "no-store" });
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`Failed to fetch categories (${res.status}): ${text}`);
                }

                const data = (await res.json()) as CategoryDTO[];
                if (!alive) return;

                setCategories(data);
            } catch (e) {
                if (!alive) return;
                console.error(e);
                setCategories([]);
                setCategoriesError("Klarte ikke å hente tags.");
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    const tagOptions = useMemo(() => {
        return categories
            .map((c) => c.name)
            .sort((a, b) => a.localeCompare(b, "nb"))
            .map((name) => ({ value: name, label: name }));
    }, [categories]);

    const visibleEvents = useMemo(() => {
        return applyFilters(pastEvents, filters);
    }, [pastEvents, filters]);

    return (
        <div className="container mx-auto pt-6 pb-12 space-y-12">
            {error && <p className="text-red-500">{error}</p>}
            {categoriesError && <p className="text-red-500">{categoriesError}</p>}

            <section>
                <div className="flex justify-start">
                    <div className="mb-4">
                        <Button
                            as={Link}
                            href="/"
                            variant="secondary"
                            icon={<ArrowLeftIcon aria-hidden />}
                        >
                            Tilbake
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-3 items-center mb-6 w-full">
                    <div />
                    <h2 className="text-2xl font-bold text-center">Alle tidligere møter</h2>
                    <div className="flex justify-end">
                        <EventFiltersModal
                            value={filters}
                            onChange={setFilters}
                            tagOptions={tagOptions}
                            showTags
                            showDateRange
                            showSort
                            labels={{ open: "Filtrer" }}
                        />
                    </div>
                </div>

                {visibleEvents.length === 0 ? (
                    <p className="text-center">Ingen tidligere møter.</p>
                ) : (
                    <ul className="grid gap-6 md:grid-cols-2">
                        {visibleEvents.map((e) => (
                            <EventRow key={e.id!} event={e as unknown as EventDto} />
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
