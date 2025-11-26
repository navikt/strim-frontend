"use client";

import {BodyShort, CopyButton, HStack, LinkCard, Tag, Tooltip, VStack} from "@navikt/ds-react";
import {CalendarIcon, ClockDashedIcon, PinIcon} from "@navikt/aksel-icons";

export type EventDto = {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    location: string;
    isPublic: boolean;
    participantLimit: number;
    signupDeadline: string | null;
    videoUrl?: string | null;
};

function formatDateLong(date: string) {
    try {
        return new Intl.DateTimeFormat("nb-NO", {
            weekday: "long",
            day: "2-digit",
            month: "long",
        }).format(new Date(date));
    } catch {
        return date;
    }
}

function formatTime(date: string) {
    try {
        return new Intl.DateTimeFormat("nb-NO", {
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(date));
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

function formatDateRange(startTime: string, endTime: string) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate()
    ) {
        return `${formatDateLong(startTime)}, ${formatTime(startTime)} – ${formatTime(endTime)}`;
    }
    return `${formatDateLong(startTime)}, ${formatTime(
        startTime,
    )} – ${formatDateLong(endTime)}, ${formatTime(endTime)}`;
}

function formatDuration(startTime: string, endTime: string) {
    const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    if (Number.isNaN(diffMs) || diffMs <= 0) return null;

    const totalMinutes = Math.round(diffMs / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);

    const parts: string[] = [];
    if (days === 1) parts.push("en dag");
    else if (days > 1) parts.push(`${days} dager`);
    if (hours > 0) parts.push(`${hours} timer`);
    if (parts.length === 0) parts.push("mindre enn en time");

    return `Varighet: ${parts.join(", ")}`;
}

export default function EventRow({ event }: { event: EventDto }) {
    const durationText = formatDuration(event.startTime, event.endTime);

    return (
        <li className="rounded-2xl bg-surface-subtle border border-border-subtle shadow-sm overflow-hidden">
            <LinkCard arrow={false} className="bg-transparent pt-2 pr-2 pb-2 pl-2 relative">
                {event.videoUrl && (
                    <Tooltip content="Kopier Live Stream lenke" placement="top">
                        <CopyButton
                            copyText={event.videoUrl}
                            text={""}
                            activeText={"Kopiert!"}
                            onClick={(e) => e.stopPropagation()}
                            size="small"
                            className="absolute right-4 top-4"
                        />
                    </Tooltip>
                )}
                <LinkCard.Title as="h3">
                    <LinkCard.Anchor href={`/events/${event.id}`}>
                        {event.title}
                    </LinkCard.Anchor>
                </LinkCard.Title>

                <LinkCard.Description>
                    <VStack gap="2">
                        <HStack gap="2" align="center">
                            <CalendarIcon aria-hidden/>
                            <BodyShort>{formatDateRange(event.startTime, event.endTime)}</BodyShort>
                        </HStack>

                        {durationText && (
                            <HStack gap="2" align="center">
                                <ClockDashedIcon aria-hidden/>
                                <BodyShort>{durationText}</BodyShort>
                            </HStack>
                        )}

                        {event.location && (
                            <HStack gap="2" align="center">
                                <PinIcon aria-hidden/>
                                <BodyShort>{event.location}</BodyShort>
                            </HStack>
                        )}

                        {event.description && (
                            <BodyShort className="line-clamp-2 mt-1">
                                {event.description}
                            </BodyShort>
                        )}
                    </VStack>
                </LinkCard.Description>

                <LinkCard.Footer>
                    <HStack gap="2" wrap>
                        <Tag size="small" variant="info">
                            {event.isPublic ? "sosialt" : "internt"}
                        </Tag>

                        {event.participantLimit > 0 && (
                            <Tag size="small" variant="info">
                                maks {event.participantLimit} deltakere
                            </Tag>
                        )}

                        {event.signupDeadline && (
                            <Tag size="small" variant="info">
                                påmeldingsfrist {formatDate(event.signupDeadline)}
                            </Tag>
                        )}
                    </HStack>
                </LinkCard.Footer>
            </LinkCard>
        </li>
    );
}
