"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {BodyLong, BodyShort, Button, CopyButton, Heading, HStack, Modal, Tag, Tooltip, VStack,} from "@navikt/ds-react";
import {ArrowLeftIcon, CalendarIcon, ClockIcon, HourglassIcon, LinkIcon, LocationPinIcon,} from "@navikt/aksel-icons";
import CategoryTags from "@/app/components/tags";
import type { EventDetailsDTO, ParticipantDTO } from "@/types/event";

function formatTime(date: string) {
    try {
        return new Intl.DateTimeFormat("nb-NO", { hour: "2-digit", minute: "2-digit" }).format(
            new Date(date),
        );
    } catch {
        return date;
    }
}

function formatDate(date: string) {
    try {
        return new Intl.DateTimeFormat("nb-NO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(new Date(date));
    } catch {
        return date;
    }
}

function formatDateNoYear(date: string) {
    try {
        return new Intl.DateTimeFormat("nb-NO", {
            day: "2-digit",
            month: "2-digit",
        }).format(new Date(date));
    } catch {
        return date;
    }
}

function formatDuration(startTime: string, endTime: string) {
    const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    if (Number.isNaN(diffMs) || diffMs <= 0) return null;

    const totalMinutes = Math.round(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours <= 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} t`;
    return `${hours} t ${minutes} min`;
}

async function fetchEventDetails(id: string): Promise<EventDetailsDTO | null> {
    const res = await fetch(`/api/events/${id}/details`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
    });

    if (res.status === 404) return null;

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to fetch event details: ${res.status} ${text}`);
    }

    return (await res.json()) as EventDetailsDTO;
}

async function joinEvent(id: string): Promise<EventDetailsDTO> {
    const res = await fetch(`/api/events/${id}/join`, {
        method: "POST",
        cache: "no-store",
        credentials: "include",
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to join: ${res.status} ${text}`);
    }

    return (await res.json()) as EventDetailsDTO;
}

async function leaveEvent(id: string): Promise<EventDetailsDTO> {
    const res = await fetch(`/api/events/${id}/join`, {
        method: "DELETE",
        cache: "no-store",
        credentials: "include",
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to leave: ${res.status} ${text}`);
    }

    return (await res.json()) as EventDetailsDTO;
}

async function fetchMe(): Promise<{ email: string; name?: string } | null> {
    const res = await fetch(`/api/me`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
    });

    if (res.status === 401) return null;
    if (!res.ok) return null;

    return (await res.json()) as { email: string; name?: string };
}

export default function EventPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id;

    const [event, setEvent] = useState<EventDetailsDTO | null>(null);
    const [meEmail, setMeEmail] = useState<string | null>(null);

    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [participantsOpen, setParticipantsOpen] = useState(false);
    const [joinLoading, setJoinLoading] = useState(false);

    useEffect(() => {
        fetchMe()
            .then((me) => setMeEmail(me?.email?.toLowerCase?.() ?? null))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!id) return;

        let cancelled = false;
        setLoading(true);
        setError(null);
        setNotFound(false);

        fetchEventDetails(id)
            .then((data) => {
                if (cancelled) return;
                if (!data) {
                    setNotFound(true);
                    setEvent(null);
                    return;
                }
                setEvent(data);
            })
            .catch((e) => {
                if (cancelled) return;
                setError(e instanceof Error ? e.message : "Unknown error");
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    const durationText = useMemo(() => {
        if (!event) return null;
        return formatDuration(event.startTime, event.endTime);
    }, [event]);

    const shareUrl = useMemo(() => {
        if (!event) return "";
        if (typeof window === "undefined") return "";
        return `${window.location.origin}/event/${event.id}`;
    }, [event]);

    const isParticipant = useMemo(() => {
        if (!event || !meEmail) return false;
        return event.participants.some((p) => p.email.toLowerCase() === meEmail);
    }, [event, meEmail]);

    const spotsText = useMemo(() => {
        if (!event) return null;
        if (!event.participantLimit || event.participantLimit <= 0) return null;
        const used = event.participants.length;
        return `${used}/${event.participantLimit}`;
    }, [event]);

    const categoriesForTags = useMemo(() => {
        if (!event) return [];
        const ids = event.categoryIds ?? [];
        const names = event.categoryNames ?? [];
        const len = Math.max(ids.length, names.length);

        return Array.from({ length: len }, (_, i) => ({
            id: ids[i] ?? -(i + 1),
            name: names[i] ?? "",
        })).filter((c) => c.name.trim().length > 0);
    }, [event]);

    const signupClosed = useMemo(() => {
        if (!event || !event.signupDeadline) return false;
        return new Date() > new Date(event.signupDeadline);
    }, [event]);

    const eventPassed = useMemo(() => {
        if (!event) return false;
        return new Date() > new Date(event.endTime);
    }, [event]);

    async function toggleJoin() {
        if (!id || !event) return;
        if (eventPassed) return;
        if (signupClosed && !isParticipant) return;

        setJoinLoading(true);
        setError(null);

        try {
            const updated = isParticipant ? await leaveEvent(id) : await joinEvent(id);
            setEvent(updated);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Ukjent feil");
        } finally {
            setJoinLoading(false);
        }
    }

    if (!id) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-4">
                    <Button as={Link} href="/" variant="secondary" icon={<ArrowLeftIcon aria-hidden />}>
                        Tilbake
                    </Button>
                </div>
                <BodyShort>Mangler id i URL.</BodyShort>
            </main>
        );
    }

    if (loading) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-4">
                    <Button as={Link} href="/" variant="secondary" icon={<ArrowLeftIcon aria-hidden />}>
                        Tilbake
                    </Button>
                </div>
                <BodyShort>Laster arrangement…</BodyShort>
            </main>
        );
    }

    if (notFound) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-4">
                    <Button as={Link} href="/" variant="secondary" icon={<ArrowLeftIcon aria-hidden />}>
                        Tilbake
                    </Button>
                </div>
                <Heading size="medium" level="1">
                    Fant ikke arrangement
                </Heading>
                <BodyShort className="mt-2">Arrangementet finnes ikke, eller du har ikke tilgang.</BodyShort>
            </main>
        );
    }

    if (error || !event) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-4">
                    <Button as={Link} href="/" variant="secondary" icon={<ArrowLeftIcon aria-hidden />}>
                        Tilbake
                    </Button>
                </div>
                <Heading size="medium" level="1">
                    Noe gikk galt
                </Heading>
                <BodyShort className="mt-2 break-words">{error ?? "Ukjent feil"}</BodyShort>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-5xl px-4 py-8">
            <div className="mb-4">
                <Button as={Link} href="/" variant="secondary" icon={<ArrowLeftIcon aria-hidden />}>
                    Tilbake
                </Button>
            </div>

            <section className="rounded-2xl border border-border-subtle bg-white shadow-sm overflow-hidden">
                <div className="flex items-start justify-between gap-4 px-6 pt-6">
                    <div className="min-w-0">
                        <Heading size="xlarge" level="1" className="break-words">
                            {event.title}
                        </Heading>
                        {spotsText && <BodyShort className="mt-2 text-text-subtle">Deltakere: {spotsText}</BodyShort>}
                    </div>

                    <HStack gap="3" className="shrink-0">
                        {!eventPassed && (() => {
                            const isDisabled = !meEmail || (!isParticipant && signupClosed);

                            const tooltipText = !meEmail
                                ? "Må være innlogget"
                                : !isParticipant && signupClosed
                                    ? "Påmeldingsfristen har passert"
                                    : "";

                            const button = (
                                <Button
                                    variant={isParticipant ? "danger" : "primary"}
                                    onClick={toggleJoin}
                                    loading={joinLoading}
                                    disabled={isDisabled}
                                >
                                    {isParticipant ? "Meld av" : "Bli med"}
                                </Button>
                            );

                            if (!isDisabled) return button;

                            return (
                                <Tooltip content={tooltipText}>
                                    <span className="inline-flex">{button}</span>
                                </Tooltip>
                            );
                        })()}

                        <CopyButton
                            copyText={shareUrl}
                            text="Kopier lenke"
                            activeText="Kopiert!"
                            icon={<LinkIcon aria-hidden />}
                        />
                    </HStack>
                </div>

                <div className="grid grid-cols-1 gap-8 px-6 pb-6 pt-6 md:grid-cols-[200px_1fr]">
                    <div>
                        <div className="flex items-start gap-4">
                            <VStack gap="3" className="min-w-0">
                                <HStack gap="2" align="center" className="flex-nowrap">
                                    <CalendarIcon aria-hidden />
                                    <BodyShort className="break-words">{formatDate(event.startTime)}</BodyShort>
                                </HStack>

                                <HStack gap="2" align="center" className="flex-nowrap">
                                    <ClockIcon aria-hidden />
                                    <BodyShort className="whitespace-nowrap">
                                        {formatTime(event.startTime)} – {formatTime(event.endTime)}
                                        {durationText ? ` (${durationText})` : ""}
                                    </BodyShort>
                                </HStack>

                                {event.signupDeadline && (
                                    <HStack gap="2" align="center" className="flex-nowrap">
                                        <HourglassIcon aria-hidden />
                                        <BodyShort className="break-words">
                                            Påmeldingsfrist:<wbr /> {formatDateNoYear(event.signupDeadline)} kl.{" "}
                                            {formatTime(event.signupDeadline)}
                                        </BodyShort>
                                    </HStack>
                                )}

                                {!!event.location && (
                                    <HStack gap="2" align="center" className="flex-nowrap">
                                        <LocationPinIcon title="a11y-title" fontSize="1.2rem" />
                                        <BodyShort className="break-words">{event.location}</BodyShort>
                                    </HStack>
                                )}

                                <div className="pt-2">
                                    <Button variant="secondary" size="small" onClick={() => setParticipantsOpen(true)}>
                                        Vis deltakere ({event.participants.length})
                                    </Button>
                                </div>
                            </VStack>
                        </div>
                    </div>

                    <div className="min-w-0">
                        <VStack gap="4">
                            <div>
                                <Heading size="medium" level="2">
                                    Detaljer
                                </Heading>
                                <BodyLong className="mt-2 whitespace-pre-line break-words max-w-prose">
                                    {event.description}
                                </BodyLong>
                            </div>

                            <HStack gap="2" wrap>
                                <Tag size="small" variant="info">
                                    {event.isPublic ? "sosialt" : "internt"}
                                </Tag>

                                {event.participantLimit > 0 && (
                                    <Tag size="small" variant="info">
                                        maks {event.participantLimit} deltakere
                                    </Tag>
                                )}
                            </HStack>

                            {event.videoUrl && (
                                <div className="pt-4">
                                    <Heading size="small" level="3">
                                        Video
                                    </Heading>

                                    <div className="relative mt-2 aspect-video">
                                        <iframe
                                            title="Event video"
                                            src={event.videoUrl}
                                            allowFullScreen
                                            className="absolute inset-0 h-full w-full rounded-lg border border-border-subtle"
                                        />
                                    </div>
                                </div>
                            )}

                            <HStack gap="2" wrap>
                                <CategoryTags categories={categoriesForTags} maxVisible={categoriesForTags.length} />
                            </HStack>
                        </VStack>
                    </div>
                </div>

                <div className="border-t border-border-subtle" />
            </section>

            <Modal open={participantsOpen} onClose={() => setParticipantsOpen(false)} aria-label="Deltakere">
                <Modal.Header>
                    <Heading size="medium" level="1">
                        Deltakere ({event.participants.length})
                    </Heading>
                </Modal.Header>
                <Modal.Body>
                    {event.participants.length === 0 ? (
                        <BodyShort>Ingen påmeldte ennå.</BodyShort>
                    ) : (
                        <VStack gap="2">
                            {event.participants.map((p: ParticipantDTO) => (
                                <div key={p.email} className="flex items-center justify-between gap-4">
                                    <BodyShort className="break-words">{p.name}</BodyShort>
                                    <BodyShort className="break-words text-text-subtle">{p.email}</BodyShort>
                                </div>
                            ))}
                        </VStack>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setParticipantsOpen(false)}>
                        Lukk
                    </Button>
                </Modal.Footer>
            </Modal>
        </main>
    );
}
