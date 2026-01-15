import {BodyShort, HStack, LinkCard, Tag, VStack, CopyButton, Tooltip,} from "@navikt/ds-react";
import { CalendarIcon, ClockDashedIcon, LocationPinIcon } from "@navikt/aksel-icons";

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
    thumbnailPath?: string | null;
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

    return `${formatDateLong(startTime)}, ${formatTime(startTime)} – ${formatDateLong(
        endTime,
    )}, ${formatTime(endTime)}`;
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

    const isUpcoming = new Date(event.endTime).getTime() > Date.now();
    const isDeadlinePassed =
        isUpcoming &&
        !!event.signupDeadline &&
        new Date(event.signupDeadline).getTime() < Date.now();

    const hasThumb = !!event.thumbnailPath && event.thumbnailPath.trim() !== "";

    return (
        <li className="relative rounded-2xl bg-surface-subtle border border-border-subtle shadow-sm overflow-hidden">
            <LinkCard arrow={false} className="bg-transparent !border-0 !shadow-none">
                <div className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {hasThumb && (
                            <div className="w-56 flex-shrink-0 self-center">
                                <div className="overflow-hidden rounded-lg">
                                    <img
                                        src={event.thumbnailPath!}
                                        alt={`${event.title} thumbnail`}
                                        className="h-38 w-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex-1">
                            <LinkCard.Title>
                                <div className="flex items-start justify-between gap-3">
                                    <LinkCard.Anchor href={`/event/${event.id}`}>{event.title}</LinkCard.Anchor>
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
                                </div>
                            </LinkCard.Title>

                            <LinkCard.Description className="mt-3">
                                <VStack gap="2">
                                    <HStack gap="2" align="center">
                                        <CalendarIcon aria-hidden />
                                        <BodyShort>{formatDateRange(event.startTime, event.endTime)}</BodyShort>
                                    </HStack>

                                    {durationText && (
                                        <HStack gap="2" align="center">
                                            <ClockDashedIcon aria-hidden />
                                            <BodyShort>{durationText}</BodyShort>
                                        </HStack>
                                    )}

                                    {event.location && (
                                        <HStack gap="2" align="center">
                                            <LocationPinIcon title="a11y-title" fontSize="1.2rem" />
                                            <BodyShort>{event.location}</BodyShort>
                                        </HStack>
                                    )}

                                    {event.description && (
                                        <BodyShort className="line-clamp-2 mt-1">{event.description}</BodyShort>
                                    )}
                                </VStack>
                            </LinkCard.Description>

                            <LinkCard.Footer className="pt-3">
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
                                        <Tag size="small" variant={isDeadlinePassed ? "error" : "info"}>
                                            {isDeadlinePassed
                                                ? `påmeldingsfrist passert ${formatDate(event.signupDeadline)}`
                                                : `påmeldingsfrist ${formatDate(event.signupDeadline)}`}
                                        </Tag>
                                    )}
                                </HStack>
                            </LinkCard.Footer>
                        </div>
                    </div>
                </div>
            </LinkCard>
        </li>
    );
}
