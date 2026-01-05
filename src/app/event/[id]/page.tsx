import {notFound} from "next/navigation";
import Link from "next/link";
import {BodyLong, BodyShort, Button, CopyButton, Heading, HStack, Tag, VStack,} from "@navikt/ds-react";
import {ArrowLeftIcon, CalendarIcon, ClockIcon, HourglassIcon, LinkIcon, LocationPinIcon,} from "@navikt/aksel-icons";

type EventDto = {
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

function formatTime(date: string) {
    try {
        return new Intl.DateTimeFormat("nb-NO", {hour: "2-digit", minute: "2-digit"}).format(
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

async function getEvent(id: string): Promise<EventDto | null> {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
    const url = new URL(`/api/read/${id}`, base).toString();

    const res = await fetch(url, {cache: "no-store"});
    if (res.status === 404) return null;

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to fetch event via ${url}: ${res.status} ${text}`);
    }

    const data = await res.json();
    if (Array.isArray(data)) throw new Error(`Expected single event, got array from ${url}`);
    return data as EventDto;
}

export default async function EventPage({params,}: {
    params: Promise<{ id: string }>;
}) {
    const {id} = await params;

    const event = await getEvent(id);
    if (!event) return notFound();


    const durationText = formatDuration(event.startTime, event.endTime);

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/event/${event.id}`;

    return (
        <main className="mx-auto max-w-5xl px-4 py-8">
            <div className="mb-4">
                <Button as={Link} href="/" variant="secondary" icon={<ArrowLeftIcon aria-hidden/>}>
                    Arrangementer
                </Button>
            </div>

            <section className="rounded-2xl border border-border-subtle bg-white shadow-sm overflow-hidden">
                <div className="flex items-start justify-between gap-4 px-6 pt-6">
                    <div className="min-w-0">
                        <Heading size="xlarge" level="1" className="break-words">
                            {event.title}
                        </Heading>
                    </div>

                    <HStack gap="3" className="shrink-0">
                        <Button variant="primary">Meld deg på</Button>
                        <CopyButton
                            copyText={shareUrl}
                            text="Kopier lenke"
                            activeText="Kopiert!"
                            icon={<LinkIcon aria-hidden/>}
                        />
                    </HStack>
                </div>
                <div className="grid grid-cols-1 gap-8 px-6 pb-6 pt-6 md:grid-cols-[200px_1fr]">
                    {/*TODO : finn en siste design for deling av space her*/}
                    <div>
                        <div className="flex items-start gap-4">
                            <VStack gap="3" className="min-w-0">

                                <HStack gap="2" align="center" className="flex-nowrap">
                                    <CalendarIcon aria-hidden/>
                                    <BodyShort className="break-words">{formatDate(event.startTime)}</BodyShort>
                                </HStack>

                                <HStack gap="2" align="center" className="flex-nowrap">
                                    <ClockIcon aria-hidden/>
                                    <BodyShort className="whitespace-nowrap">
                                        {formatTime(event.startTime)} – {formatTime(event.endTime)}
                                        {durationText ? ` (${durationText})` : ""}
                                    </BodyShort>
                                </HStack>
                                {event.signupDeadline && (
                                    <HStack gap="2" align="center" className="flex-nowrap">
                                        <HourglassIcon aria-hidden/>
                                        <BodyShort className="break-words">
                                            Påmeldingsfrist:<wbr/> {formatDateNoYear(event.signupDeadline)} kl. {formatTime(event.signupDeadline)}
                                        </BodyShort>
                                    </HStack>

                                )}

                                {!!event.location && (
                                    <HStack gap="2" align="center" className="flex-nowrap">
                                        <LocationPinIcon title="a11y-title" fontSize="1.2rem"/>
                                        <BodyShort className="break-words">{event.location}</BodyShort>
                                    </HStack>
                                )}

                                <div className="pt-2">
                                    <Button variant="secondary" size="small">
                                        Vis deltakere
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
                                <div className="pt-2">
                                    <Heading size="small" level="3">
                                        Video
                                    </Heading>
                                    <BodyShort className="mt-1 break-all">{event.videoUrl}</BodyShort>
                                </div>
                            )}
                        </VStack>
                    </div>
                </div>

                <div className="border-t border-border-subtle"/>
            </section>
        </main>
    );
}
