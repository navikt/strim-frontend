"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {BodyLong, BodyShort, Button, CopyButton, Heading, HStack, Modal, Tag, Tooltip, VStack, Loader, TextField, Switch,} from "@navikt/ds-react";
import {ArrowLeftIcon, CalendarIcon, ClockIcon, HourglassIcon, LinkIcon, LocationPinIcon, PersonCircleIcon, PencilIcon,} from "@navikt/aksel-icons";
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

async function patchEvent(
    id: string,
    body: Partial<{
        title: string;
        description: string;
        location: string;
        videoUrl: string | null;
        thumbnailPath: string | null;
        isPublic: boolean;
        participantLimit: number;
    }>,
): Promise<EventDetailsDTO> {
    const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        cache: "no-store",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to update: ${res.status} ${text}`);
    }

    return (await res.json()) as EventDetailsDTO;
}

function toNullableString(s: string): string | null {
    const t = s.trim();
    return t.length ? t : null;
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

    const [isFullOverride, setIsFullOverride] = useState(false);

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [titleDraft, setTitleDraft] = useState("");
    const [descriptionDraft, setDescriptionDraft] = useState("");
    const [locationDraft, setLocationDraft] = useState("");
    const [videoUrlDraft, setVideoUrlDraft] = useState("");
    const [isPublicDraft, setIsPublicDraft] = useState(true);
    const [participantLimitDraft, setParticipantLimitDraft] = useState<string>("0");

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

                setTitleDraft(data.title ?? "");
                setDescriptionDraft(data.description ?? "");
                setLocationDraft(data.location ?? "");
                setVideoUrlDraft(data.videoUrl ?? "");
                setIsPublicDraft(data.isPublic);
                setParticipantLimitDraft(String(data.participantLimit ?? 0));

                setIsFullOverride(false);
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

    const isOwner = useMemo(() => {
        if (!event || !meEmail) return false;
        const ownerEmail = (event.createdByEmail ?? "").toLowerCase();
        return ownerEmail.length > 0 && ownerEmail === meEmail;
    }, [event, meEmail]);

    const spotsText = useMemo(() => {
        if (!event) return null;
        if (!event.participantLimit || event.participantLimit <= 0) return null;
        const used = event.participants.length;
        return `${used}/${event.participantLimit}`;
    }, [event]);

    const isFullComputed = useMemo(() => {
        if (!event) return false;
        const limit = event.participantLimit ?? 0;
        if (limit <= 0) return false; // 0 = unlimited (your current convention)
        return event.participants.length >= limit;
    }, [event]);

    const isFull = isFullOverride || isFullComputed;

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

        if (isFull && !isParticipant) return;

        setJoinLoading(true);
        setError(null);

        try {
            const updated = isParticipant ? await leaveEvent(id) : await joinEvent(id);
            setEvent(updated);

            setIsFullOverride(false);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Ukjent feil";

            if (!isParticipant && typeof msg === "string" && msg.includes("Failed to join: 409")) {
                setIsFullOverride(true);
                setError(null); // don't show "noe gikk galt"
            } else {
                setError(msg);
            }
        } finally {
            setJoinLoading(false);
        }
    }

    function startEdit() {
        if (!event) return;
        setTitleDraft(event.title ?? "");
        setDescriptionDraft(event.description ?? "");
        setLocationDraft(event.location ?? "");
        setVideoUrlDraft(event.videoUrl ?? "");
        setIsPublicDraft(event.isPublic);
        setParticipantLimitDraft(String(event.participantLimit ?? 0));
        setEditing(true);
        setError(null);
    }

    function cancelEdit() {
        if (!event) return;
        setTitleDraft(event.title ?? "");
        setDescriptionDraft(event.description ?? "");
        setLocationDraft(event.location ?? "");
        setVideoUrlDraft(event.videoUrl ?? "");
        setIsPublicDraft(event.isPublic);
        setParticipantLimitDraft(String(event.participantLimit ?? 0));
        setEditing(false);
        setError(null);
    }

    async function saveEdit() {
        if (!id || !event) return;

        const title = titleDraft.trim();
        if (!title.length) {
            setError("Tittel kan ikke være tom.");
            return;
        }

        const limitNum = Number(participantLimitDraft);
        if (!Number.isFinite(limitNum) || limitNum < 0) {
            setError("Maks deltakere må være et tall (0 eller mer).");
            return;
        }

        const payload: Record<string, any> = {};

        if (title !== (event.title ?? "")) payload.title = title;
        if (descriptionDraft !== (event.description ?? "")) payload.description = descriptionDraft;
        if (locationDraft.trim() !== (event.location ?? "")) payload.location = locationDraft.trim();
        if (toNullableString(videoUrlDraft) !== (event.videoUrl ?? null)) {
            payload.videoUrl = toNullableString(videoUrlDraft);
        }
        if (isPublicDraft !== event.isPublic) payload.isPublic = isPublicDraft;
        if (limitNum !== (event.participantLimit ?? 0)) payload.participantLimit = limitNum;

        if (Object.keys(payload).length === 0) {
            setEditing(false);
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const updated = await patchEvent(id, payload);
            setEvent(updated);

            setTitleDraft(updated.title ?? "");
            setDescriptionDraft(updated.description ?? "");
            setLocationDraft(updated.location ?? "");
            setVideoUrlDraft(updated.videoUrl ?? "");
            setIsPublicDraft(updated.isPublic);
            setParticipantLimitDraft(String(updated.participantLimit ?? 0));

            // NEW: participantLimit changed => reset override and let computed value decide
            setIsFullOverride(false);

            setEditing(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Ukjent feil");
        } finally {
            setSaving(false);
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
                <Loader size="3xlarge" title="Venter..." />
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
                        {editing ? (
                            <div className="max-w-2xl">
                                <TextField
                                    label="Tittel"
                                    value={titleDraft}
                                    onChange={(e) => setTitleDraft(e.target.value)}
                                    disabled={saving}
                                />
                            </div>
                        ) : (
                            <Heading size="xlarge" level="1" className="break-words">
                                {event.title}
                            </Heading>
                        )}

                        {spotsText && <BodyShort className="mt-2 text-text-subtle">Deltakere: {spotsText}</BodyShort>}
                    </div>

                    <HStack gap="2" className="shrink-0">
                        {isOwner && !eventPassed && !editing && (
                            <Tooltip content="Rediger arrangement">
                                <Button
                                    variant="tertiary"
                                    size="small"
                                    icon={<PencilIcon aria-hidden />}
                                    onClick={startEdit}
                                />
                            </Tooltip>
                        )}

                        {isOwner && editing && (
                            <>
                                <Tooltip content="lagre endring">
                                    <Button variant="primary" size="small" onClick={saveEdit} loading={saving}>
                                        Lagre endringer
                                    </Button>
                                </Tooltip>

                                <Tooltip content="avbryt">
                                    <Button variant="secondary" size="small" onClick={cancelEdit} disabled={saving}>
                                        Avbryt
                                    </Button>
                                </Tooltip>
                            </>
                        )}

                        {!eventPassed &&
                            (() => {
                                const fullAndTryingToJoin = isFull && !isParticipant;

                                const isDisabled =
                                    !meEmail ||
                                    (!isParticipant && signupClosed) ||
                                    editing ||
                                    fullAndTryingToJoin;

                                const tooltipText = editing
                                    ? "Lagre/avbryt redigering først"
                                    : !meEmail
                                        ? "Må være innlogget"
                                        : !isParticipant && signupClosed
                                            ? "Påmeldingsfristen har passert"
                                            : fullAndTryingToJoin
                                                ? "Maks deltakere nådd"
                                                : "";

                                const buttonText = isParticipant
                                    ? "Meld av"
                                    : fullAndTryingToJoin
                                        ? "Maks deltakere nådd"
                                        : "Bli med";

                                const buttonVariant =
                                    fullAndTryingToJoin ? "danger" : isParticipant ? "danger" : "primary";

                                const button = (
                                    <Button
                                        variant={buttonVariant}
                                        onClick={toggleJoin}
                                        loading={joinLoading}
                                        disabled={isDisabled}
                                    >
                                        {buttonText}
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

                                <div className="pb-1">
                                    <label className="flex items-center gap-2">
                                        <PersonCircleIcon aria-hidden />
                                        Arrangeres av:
                                    </label>

                                    <div className="ml-[0.2rem] pl-6">
                                        <Link
                                            href={`mailto:${event.createdByEmail}`}
                                            title={`Send e-post til ${event.createdByName}`}
                                            className="leading-relaxed text-blue-600 hover:underline"
                                        >
                                            {event.createdByName}
                                        </Link>
                                    </div>
                                </div>

                                <div>
                                    {!!event.location && !editing && (
                                        <HStack gap="2" align="center" className="flex-nowrap">
                                            <LocationPinIcon title="a11y-title" fontSize="1.2rem" />
                                            <BodyShort className="break-words">{event.location}</BodyShort>
                                        </HStack>
                                    )}

                                    {editing && (
                                        <div className="max-w-sm">
                                            <TextField
                                                label="Sted"
                                                value={locationDraft}
                                                onChange={(e) => setLocationDraft(e.target.value)}
                                                size="small"
                                                disabled={saving}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <Button
                                        variant="secondary"
                                        size="small"
                                        onClick={() => setParticipantsOpen(true)}
                                        disabled={editing}
                                    >
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

                                {!editing ? (
                                    <BodyLong className="mt-2 whitespace-pre-line break-words max-w-prose">
                                        {event.description}
                                    </BodyLong>
                                ) : (
                                    <div className="max-w-prose">
                                        <TextField
                                            label="Beskrivelse"
                                            value={descriptionDraft}
                                            onChange={(e) => setDescriptionDraft(e.target.value)}
                                            disabled={saving}
                                        />
                                    </div>
                                )}
                            </div>

                            <HStack gap="6" wrap>
                                {editing ? (
                                    <Switch
                                        checked={isPublicDraft}
                                        onChange={(e) => setIsPublicDraft(e.target.checked)}
                                        disabled={saving}
                                    >
                                        {isPublicDraft ? "sosialt" : "internt"}
                                    </Switch>
                                ) : (
                                    <Tag size="small" variant="info">
                                        {event.isPublic ? "sosialt" : "internt"}
                                    </Tag>
                                )}

                                {editing ? (
                                    <div className="max-w-[180px]">
                                        <TextField
                                            label="Maks deltakere"
                                            value={participantLimitDraft}
                                            onChange={(e) => setParticipantLimitDraft(e.target.value)}
                                            disabled={saving}
                                            size="small"
                                        />
                                    </div>
                                ) : (
                                    event.participantLimit > 0 && (
                                        <Tag size="small" variant="info">
                                            maks {event.participantLimit} deltakere
                                        </Tag>
                                    )
                                )}
                            </HStack>

                            {!editing && event.videoUrl && (
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

                            {editing && (
                                <div className="pt-2 max-w-prose">
                                    <TextField
                                        label="Video URL"
                                        value={videoUrlDraft}
                                        onChange={(e) => setVideoUrlDraft(e.target.value)}
                                        disabled={saving}
                                    />
                                    <BodyShort className="mt-2 text-text-subtle">
                                        Tom = fjern video (lagres som null).
                                    </BodyShort>
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

            <Modal
                open={participantsOpen}
                onClose={() => setParticipantsOpen(false)}
                aria-labelledby="modal-heading"
                className="![min-width:220px]"
            >
                <Modal.Header closeButton>
                    <Heading id="modal-heading" size="medium" level="1">
                        Deltakere
                    </Heading>
                </Modal.Header>

                <Modal.Body>
                    <div className="flex flex-col gap-6">
                        <ul className="flex flex-col gap-1">
                            {event.participants.map((p: ParticipantDTO) => (
                                <li className="pb-4" key={p.email}>
                                    <div className="flex items-center justify-between gap-3">
                                        <BodyShort className="break-words">{p.name || p.email}</BodyShort>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Modal.Body>
            </Modal>
        </main>
    );
}
