"use client";

import { useEffect, useMemo, useState } from "react";
import EventRow, { EventDto } from "@/app/components/event/eventKort";
import TilbakeKnapp from "@/app/components/tilbake";
import {
    EventFiltersModal,
    EventFilterValue,
    SortOption,
} from "@/app/components/eventfilter/EventFiltersModal";

type BackendEvent = any;

type EventListResponse = {
    upcoming: BackendEvent[];
    past: BackendEvent[];
};

const defaultFilter: EventFilterValue = {
    q: "",
    fromDate: null,
    toDate: null,
    tags: [],
    sort: "",
};

function normalizeEvent(e: BackendEvent): EventDto {
    // already in expected shape
    if (
        Array.isArray(e?.categories) &&
        (e.categories.length === 0 ||
            (typeof e.categories[0] === "object" &&
                e.categories[0] !== null &&
                "name" in e.categories[0]))
    ) {
        return e as EventDto;
    }

    const ids: number[] = Array.isArray(e?.categoryIds) ? e.categoryIds : [];
    const names: string[] = Array.isArray(e?.categoryNames) ? e.categoryNames : [];

    const categories =
        names.length > 0
            ? names.map((name, idx) => ({
                id: typeof ids[idx] === "number" ? ids[idx] : idx + 1,
                name,
            }))
            : undefined;

    return {
        id: e.id,
        title: e.title,
        description: e.description,
        startTime: e.startTime,
        endTime: e.endTime,
        location: e.location,
        isPublic: e.isPublic,
        participantLimit: e.participantLimit,
        signupDeadline: e.signupDeadline ?? null,
        videoUrl: e.videoUrl ?? null,
        thumbnailPath: e.thumbnailPath ?? null,
        categories,
    };
}

function getEventTags(e: EventDto): string[] {
    const cats = e.categories;
    if (!Array.isArray(cats)) return [];
    return cats
        .map((c: any) => (typeof c === "string" ? c : c?.name))
        .filter(Boolean);
}

function getEventDate(e: EventDto): Date | null {
    if (!e.startTime) return null;
    try {
        return new Date(e.startTime);
    } catch {
        return null;
    }
}

export default function MineMoterPage() {
    const [data, setData] = useState<{ upcoming: EventDto[]; past: EventDto[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<EventFilterValue>(defaultFilter);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch("/api/events/mine");
                if (!res.ok) throw new Error("Failed to fetch my events");

                const json: EventListResponse = await res.json();

                setData({
                    upcoming: (json.upcoming ?? []).map(normalizeEvent),
                    past: (json.past ?? []).map(normalizeEvent),
                });
            } catch {
                setError("Kunne ikke hente møter");
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, []);

    const tagOptions = useMemo(() => {
        if (!data) return [];
        const all = [...data.upcoming, ...data.past];
        const set = new Set<string>();
        all.forEach((ev) => getEventTags(ev).forEach((t) => set.add(t)));
        return Array.from(set).map((v) => ({ value: v, label: v }));
    }, [data]);

    function applyFilters(list: EventDto[]): EventDto[] {
        const q = filters.q.trim().toLowerCase();
        const from = filters.fromDate ? new Date(filters.fromDate) : null;
        const to = filters.toDate ? new Date(filters.toDate) : null;
        const selectedTags = filters.tags || [];

        let out = list.filter((ev) => {
            if (q) {
                const title = (ev.title ?? "").toLowerCase();
                const desc = (ev.description ?? "").toLowerCase();
                if (!title.includes(q) && !desc.includes(q)) return false;
            }

            const evDate = getEventDate(ev);
            if (from && evDate && evDate < new Date(from.setHours(0, 0, 0, 0))) return false;
            if (to && evDate && evDate > new Date(to.setHours(23, 59, 59, 999))) return false;

            if (selectedTags.length > 0) {
                const evTags = getEventTags(ev);
                const hasAll = selectedTags.every((t) => evTags.includes(t));
                if (!hasAll) return false;
            }

            return true;
        });

        if (filters.sort) {
            const sort = filters.sort as SortOption;
            out = out.slice();
            out.sort((a, b) => {
                if (sort === "date_asc" || sort === "date_desc") {
                    const da = getEventDate(a)?.getTime() ?? 0;
                    const db = getEventDate(b)?.getTime() ?? 0;
                    return sort === "date_asc" ? da - db : db - da;
                }
                if (sort === "title_asc" || sort === "title_desc") {
                    const ta = (a.title ?? "").localeCompare(b.title ?? "");
                    return sort === "title_asc" ? ta : -ta;
                }
                return 0;
            });
        }

        return out;
    }

    const filteredUpcoming = data ? applyFilters(data.upcoming) : [];
    const filteredPast = data ? applyFilters(data.past) : [];

    return (
        <div className="container relative mx-auto pt-12 pb-12 space-y-12">
            <TilbakeKnapp />

            <section>
                <div className="flex items-center justify-between mb-6 gap-4">
                    <h1 className="text-3xl font-bold">Møter du er meldt på</h1>

                    <EventFiltersModal
                        value={filters}
                        onChange={(next) => setFilters(next)}
                        tagOptions={tagOptions}
                        showDateRange
                        showTags
                        showSort
                    />
                </div>
            </section>

            {loading && <p>Laster...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && data && (
                <>
                    <section>
                        <div className="flex items-baseline justify-between gap-4 mb-4">
                            <h2 className="text-2xl font-bold">Kommende møter</h2>
                        </div>

                        {filteredUpcoming.length === 0 ? (
                            <p>Ingen kommende møter.</p>
                        ) : (
                            <ul className="grid gap-6 md:grid-cols-2">
                                {filteredUpcoming.map((event) => (
                                    <EventRow key={event.id} event={event} />
                                ))}
                            </ul>
                        )}
                    </section>

                    <section>
                        <div className="flex items-baseline justify-between gap-4 mb-4">
                            <h2 className="text-xl font-semibold">Møter du har deltatt i</h2>
                        </div>

                        {filteredPast.length === 0 ? (
                            <p>Ingen tidligere møter.</p>
                        ) : (
                            <ul className="grid gap-6 md:grid-cols-2">
                                {filteredPast.map((event) => (
                                    <EventRow key={event.id} event={event} />
                                ))}
                            </ul>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
