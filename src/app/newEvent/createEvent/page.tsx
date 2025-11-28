"use client";

import {FormEvent, useState} from "react";
import {
    BodyLong,
    Button,
    Checkbox,
    DatePicker,
    Fieldset,
    Heading,
    HGrid,
    Textarea,
    TextField,
    useDatepicker,
    VStack,
} from "@navikt/ds-react";
import type {EventDTO} from "@/types/event";

type EventFormState = {
    title: string;
    description: string;
    streamUrl: string;
    fromDate?: Date;
    fromTime: string;
    toDate?: Date;
    toTime: string;
    location: string;
    isPublic: boolean;
    limitParticipants: boolean;
    participantLimit: string;
    hasSignupDeadline: boolean;
    signupDeadlineDate?: Date;
    signupDeadlineTime: string;
};

const initialForm: EventFormState = {
    title: "",
    description: "",
    streamUrl: "",
    fromDate: undefined,
    fromTime: "",
    toDate: undefined,
    toTime: "",
    location: "",
    isPublic: true,
    limitParticipants: false,
    participantLimit: "",
    hasSignupDeadline: false,
    signupDeadlineDate: undefined,
    signupDeadlineTime: "",
};

export default function CreateEventPage() {
    const [form, setForm] = useState<EventFormState>(initialForm);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const update = <K extends keyof EventFormState>(key: K, value: EventFormState[K]) => {
        setForm((prev) => ({...prev, [key]: value}));
    };

    const fromDatepicker = useDatepicker({onDateChange: (date) => update("fromDate", date)});
    const toDatepicker = useDatepicker({onDateChange: (date) => update("toDate", date)});
    const signupDatepicker = useDatepicker({
        onDateChange: (date) => update("signupDeadlineDate", date),
    });

    const toLocalDateTimeString = (date?: Date, time?: string) => {
        if (!date || !time) return null;
        const [hours, minutes] = time.split(":").map(Number);
        if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}T${time}:00`;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!form.title || !form.description || !form.location) {
            setError("Fyll ut tittel, beskrivelse og lokasjon.");
            return;
        }

        const startTime = toLocalDateTimeString(form.fromDate, form.fromTime);
        const endTime = toLocalDateTimeString(form.toDate, form.toTime);
        const signupDeadline = form.hasSignupDeadline
            ? toLocalDateTimeString(form.signupDeadlineDate, form.signupDeadlineTime)
            : null;

        if (!startTime || !endTime) {
            setError("Du må fylle inn gyldig start- og slutttid.");
            return;
        }

        if (form.limitParticipants && !form.participantLimit) {
            setError("Angi maks antall deltakere eller fjern begrensningen.");
            return;
        }

        if (form.hasSignupDeadline && (!form.signupDeadlineDate || !form.signupDeadlineTime)) {
            setError("Fyll ut både dato og tid for påmeldingsfrist, eller slå den av.");
            return;
        }

        const payload: EventDTO = {
            title: form.title,
            description: form.description,
            videoUrl: form.streamUrl || null,
            startTime,
            endTime,
            location: form.location,
            isPublic: form.isPublic,
            participantLimit: form.limitParticipants ? Number(form.participantLimit || 0) : 0,
            signupDeadline,
        };

        try {
            setSubmitting(true);

            const res = await fetch("/api/create", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("Create event failed:", res.status, text);
                setError("Klarte ikke å opprette arrangement. Prøv igjen.");
                return;
            }

            setSuccess(true);
            setForm(initialForm);
        } catch (err) {
            console.error(err);
            setError("En ukjent feil oppstod.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-b from-[rgba(0,0,0,0.02)] to-[rgba(0,0,0,0.06)] flex justify-center px-4 py-10">
            <div className="w-full max-w-3xl">
                <Heading level="1" size="xlarge" className="text-center mb-8">
                    Opprett nytt arrangement
                </Heading>

                <form
                    onSubmit={handleSubmit}
                    className="bg-surface-default rounded-3xl shadow-md border border-border-subtle p-6 md:p-8"
                >
                    <VStack gap="6">
                        <TextField
                            label="Tittel"
                            value={form.title}
                            onChange={(e) => update("title", e.target.value)}
                        />

                        <Textarea
                            label="Beskrivelse"
                            value={form.description}
                            minRows={4}
                            onChange={(e) => update("description", e.target.value)}
                            placeholder={"En beskrivelse av arrangementet"}
                        />

                        <TextField
                            label="Streaming-link (valgfritt)"
                            value={form.streamUrl}
                            onChange={(e) => update("streamUrl", e.target.value)}
                            placeholder="https://teams.microsoft.com/..."
                        />

                        <HGrid gap="6" columns={{xs: 1, md: 2}}>
                            <Fieldset legend="Fra">
                                <VStack gap="3">
                                    <DatePicker {...fromDatepicker.datepickerProps}>
                                        <DatePicker.Input
                                            {...fromDatepicker.inputProps}
                                            label="Startdato"
                                            placeholder="dd.mm.åååå"
                                        />
                                    </DatePicker>

                                    <TextField
                                        label="Starttid"
                                        type="time"
                                        value={form.fromTime}
                                        onChange={(e) => update("fromTime", e.target.value)}
                                    />
                                </VStack>
                            </Fieldset>

                            <Fieldset legend="Til">
                                <VStack gap="3">
                                    <DatePicker {...toDatepicker.datepickerProps}>
                                        <DatePicker.Input
                                            {...toDatepicker.inputProps}
                                            label="Sluttdato"
                                            placeholder="dd.mm.åååå"
                                        />
                                    </DatePicker>

                                    <TextField
                                        label="Slutttid"
                                        type="time"
                                        value={form.toTime}
                                        onChange={(e) => update("toTime", e.target.value)}
                                    />
                                </VStack>
                            </Fieldset>
                        </HGrid>

                        <TextField
                            label="Lokasjon"
                            value={form.location}
                            onChange={(e) => update("location", e.target.value)}
                        />

                        <Checkbox
                            checked={form.isPublic}
                            onChange={(e) => update("isPublic", e.target.checked)}
                        >
                            Arrangementet er offentlig
                        </Checkbox>

                        <Checkbox
                            checked={form.limitParticipants}
                            onChange={(e) => update("limitParticipants", e.target.checked)}
                        >
                            Maks antall deltakere
                        </Checkbox>

                        {form.limitParticipants && (
                            <TextField
                                label="Antall"
                                type="number"
                                min={1}
                                value={form.participantLimit}
                                onChange={(e) => update("participantLimit", e.target.value)}
                            />
                        )}

                        <Checkbox
                            checked={form.hasSignupDeadline}
                            onChange={(e) => update("hasSignupDeadline", e.target.checked)}
                        >
                            Påmeldingsfrist
                        </Checkbox>

                        {form.hasSignupDeadline && (
                            <HGrid gap="4" columns={{xs: 1, md: 2}}>
                                <DatePicker {...signupDatepicker.datepickerProps}>
                                    <DatePicker.Input
                                        {...signupDatepicker.inputProps}
                                        label="Fristdato"
                                        placeholder="dd.mm.åååå"
                                    />
                                </DatePicker>

                                <TextField
                                    label="Fristtid"
                                    type="time"
                                    value={form.signupDeadlineTime}
                                    onChange={(e) =>
                                        update("signupDeadlineTime", e.target.value)
                                    }
                                />
                            </HGrid>
                        )}

                        {error && <BodyLong className="text-red-600">{error}</BodyLong>}
                        {success && (
                            <BodyLong className="text-green-600">
                                Arrangementet ble opprettet!
                            </BodyLong>
                        )}

                        <div className="pt-2">
                            <Button type="submit" loading={submitting}>
                                Opprett
                            </Button>
                        </div>
                    </VStack>
                </form>
            </div>
        </div>
    );
}
