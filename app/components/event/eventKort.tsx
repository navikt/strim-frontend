// app/components/event/eventKort.tsx
"use client";

import Image from "next/image";
import { BodyShort, HStack, LinkCard, Tag, VStack } from "@navikt/ds-react";
import { BellIcon, ClockDashedIcon, LinkIcon } from "@navikt/aksel-icons";

export type EventDto = {
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
};

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

export default function EventRow({ event }: { event: EventDto }) {
    return (
        <li
            className="
        rounded-2xl bg-surface-subtle border border-border-subtle shadow-sm
        overflow-hidden
      "
        >
            <div className="flex items-stretch">
                <div className="w-[260px] h-[140px] md:w-[300px] md:h-[160px] relative shrink-0">
                     {/*TODO : lag en sjekk for om bilde link ikke funke*/}
                    {event.imageUrl ? (
                        <Image
                            src={event.imageUrl}
                            alt={event.title ?? "møte bilde"}
                            fill
                            sizes="(max-width: 768px) 260px, 300px"
                            className="object-cover"
                            unoptimized
                        />
                    ) : (
                        <div className="absolute inset-0 grid place-items-center bg-surface-neutral-subtle">
                            <BodyShort className="text-text-subtle">Ingen bilde</BodyShort>
                        </div>
                    )}
                </div>
                <div className="flex-1 p-4 pr-2">
                    <LinkCard arrow={false} className="bg-transparent">
                        <LinkCard.Title as="h3">
                            <LinkCard.Anchor href={`/events/${event.id}`}>
                                {event.title}
                            </LinkCard.Anchor>
                        </LinkCard.Title>

                        <LinkCard.Description>
                            <VStack gap="2">
                                <HStack gap="2" align="center">
                                    <ClockDashedIcon aria-hidden />
                                    <span>{formatDate(event.startTime)}</span>
                                    {event.location && (
                                        <>
                                            <span aria-hidden>·</span>
                                            <span>{event.location}</span>
                                        </>
                                    )}
                                </HStack>

                                {event.description && (
                                    <BodyShort className="line-clamp-2">
                                        {event.description}
                                    </BodyShort>
                                )}
                            </VStack>
                        </LinkCard.Description>

                        <LinkCard.Footer>
                            <Tag size="small" variant={event.isPublic ? "success" : "neutral"}>
                                {event.isPublic ? "Åpen" : "Internt"}
                            </Tag>
                        </LinkCard.Footer>
                    </LinkCard>
                </div>
                <div className="flex flex-col gap-2 p-3 pr-4 justify-start items-center">
                    <a
                        href={`/events/${event.id}#notify`}
                        className="inline-flex p-2 rounded-lg border border-border-subtle hover:bg-surface-subtle"
                        aria-label="Varsle meg"
                        title="Varsle meg"
                    >
                        <BellIcon aria-hidden />
                    </a>
                    <a
                        href={`/events/${event.id}`}
                        className="inline-flex p-2 rounded-lg border border-border-subtle hover:bg-surface-subtle"
                        aria-label="Åpne lenke"
                        title="Åpne lenke"
                    >
                        <LinkIcon aria-hidden />
                    </a>
                </div>
            </div>
        </li>
    );
}
