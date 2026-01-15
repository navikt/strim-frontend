"use client";

import { useState } from "react";
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
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { EventDTO } from "@/types/event";

const eventSchema = z
    .object({
        title: z.string().min(1, "Du må fylle inn tittel."),
        description: z.string().min(1, "Du må fylle inn beskrivelse."),
        fromTime: z.string().min(1, "Du må velge starttid."),
        toTime: z.string().min(1, "Du må velge slutttid."),
        location: z.string().min(1, "Du må fylle inn lokasjon."),


        isPublic: z.boolean(),
        limitParticipants: z.boolean(),
        hasSignupDeadline: z.boolean(),

        participantLimit: z.string().optional(),
        signupDeadlineTime: z.string().optional(),

        videoUrl: z
            .string()
            .optional()
            .or(z.literal(""))
            .refine(
                (v) => !v || v === "" || /^https?:\/\/.+/i.test(v),
                "Livestream-lenken må være en gyldig URL (må starte med http eller https)",
            ),
        thumbnailPath: z
            .string()
            .optional()
            .or(z.literal(""))
            .refine(
                (v) => !v || v === "" || /^https?:\/\/.+/i.test(v),
                "Thumbnail-lenken må være en gyldig URL (må starte med http eller https)",
            ),
    })
    .superRefine((values, ctx) => {
        if (values.limitParticipants) {
            if (!values.participantLimit || values.participantLimit.trim() === "") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["participantLimit"],
                    message: "Du må sette maks antall deltakere.",
                });
            } else if (Number(values.participantLimit) <= 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["participantLimit"],
                    message: "Må være større enn 0.",
                });
            }
        }

        if (values.hasSignupDeadline) {
            if (!values.signupDeadlineTime) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["signupDeadlineTime"],
                    message: "Du må sette tidspunkt for påmeldingsfrist.",
                });
            }
        }
    });

type EventFormValues = z.infer<typeof eventSchema>;

function combineDateAndTime(date?: Date, time?: string): Date | null {
    if (!date || !time) return null;
    const [hours, minutes] = time.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
}

function toLocalDateTimeString(date?: Date, time?: string): string | null {
    if (!date || !time) return null;

    const [hours, minutes] = time.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}T${time}:00`;
}

export default function CreateEventPage() {
    const [fromDate, setFromDate] = useState<Date | undefined>();
    const [toDate, setToDate] = useState<Date | undefined>();
    const [signupDeadlineDate, setSignupDeadlineDate] = useState<Date | undefined>();

    const [submitting, setSubmitting] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        setError,
        reset,
    } = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        mode: "onChange",
        defaultValues: {
            title: "",
            description: "",
            fromTime: "",
            toTime: "",
            location: "",
            isPublic: true,
            limitParticipants: false,
            hasSignupDeadline: false,
            participantLimit: "",
            signupDeadlineTime: "",
            videoUrl: "",
            thumbnailPath: ""
        },
    });
    const fromTime = watch("fromTime");
    const toTime = watch("toTime");
    const hasSignupDeadline = watch("hasSignupDeadline");
    const signupDeadlineTime = watch("signupDeadlineTime");
    const limitParticipants = watch("limitParticipants");

    const now = new Date();
    const start = combineDateAndTime(fromDate, fromTime);
    const end = combineDateAndTime(toDate, toTime);
    const signupDeadline = hasSignupDeadline
        ? combineDateAndTime(signupDeadlineDate, signupDeadlineTime)
        : null;

    let startDateTimeError: string | undefined;
    let endDateTimeError: string | undefined;
    let signupDeadlineError: string | undefined;

    if (start) {
        if (start < now) {
            startDateTimeError = "Starttid kan ikke være i fortiden.";
        }
    }

    if (start && end) {
        if (end <= start) {
            endDateTimeError = "Slutttid må være etter starttid.";
        }
    }

    if (signupDeadline) {
        if (signupDeadline < now) {
            signupDeadlineError = "Påmeldingsfrist kan ikke være i fortiden.";
        } else if (start && signupDeadline >= start) {
            signupDeadlineError = "Påmeldingsfrist må være før starttid.";
        }
    }

    const fromDatepicker = useDatepicker({
        onDateChange: (date) => setFromDate(date ?? undefined),
    });

    const toDatepicker = useDatepicker({
        onDateChange: (date) => setToDate(date ?? undefined),
    });

    const signupDatepicker = useDatepicker({
        onDateChange: (date) => setSignupDeadlineDate(date ?? undefined),
    });

    const onSubmit: SubmitHandler<EventFormValues> = async (values) => {
        setGlobalError(null);
        setSuccess(false);

        if (!fromDate) {
            setError("fromTime", {
                type: "manual",
                message: "Du må velge startdato.",
            });
            return;
        }
        if (!toDate) {
            setError("toTime", {
                type: "manual",
                message: "Du må velge sluttdato.",
            });
            return;
        }
        if (hasSignupDeadline && !signupDeadlineDate) {
            setError("signupDeadlineTime", {
                type: "manual",
                message: "Du må velge dato for påmeldingsfrist.",
            });
            return;
        }

        if (startDateTimeError) {
            setError("fromTime", { type: "manual", message: startDateTimeError });
            return;
        }
        if (endDateTimeError) {
            setError("toTime", { type: "manual", message: endDateTimeError });
            return;
        }
        if (signupDeadlineError) {
            setError("signupDeadlineTime", {
                type: "manual",
                message: signupDeadlineError,
            });
            return;
        }

        const startTime = toLocalDateTimeString(fromDate, values.fromTime);
        const endTime = toLocalDateTimeString(toDate, values.toTime);
        const signupDeadlineStr =
            hasSignupDeadline && signupDeadlineDate && values.signupDeadlineTime
                ? toLocalDateTimeString(signupDeadlineDate, values.signupDeadlineTime)
                : null;

        if (!startTime || !endTime) {
            setGlobalError("Noe gikk galt med dato/tid. Prøv igjen.");
            return;
        }

        const payload: EventDTO = {
            title: values.title.trim(),
            description: values.description.trim(),
            videoUrl:
                values.videoUrl && values.videoUrl.trim() !== ""
                    ? values.videoUrl.trim()
                    : null,
            startTime,
            endTime,
            location: values.location.trim(),
            isPublic: values.isPublic,
            participantLimit: values.limitParticipants
                ? Number(values.participantLimit || 0)
                : 0,
            signupDeadline: signupDeadlineStr,
            thumbnailPath:
                values.thumbnailPath && values.thumbnailPath.trim() !== ""
                    ? values.thumbnailPath.trim()
                    : null,
        };

        try {
            setSubmitting(true);

            const res = await fetch("/api/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("Create event failed:", res.status, text);
                setGlobalError("Klarte ikke å opprette arrangement. Prøv igjen.");
                return;
            }

            setSuccess(true);
            reset({
                title: "",
                description: "",
                fromTime: "",
                toTime: "",
                location: "",
                isPublic: true,
                limitParticipants: false,
                hasSignupDeadline: false,
                participantLimit: "",
                signupDeadlineTime: "",
                videoUrl: "",
                thumbnailPath: ""
            });
            setFromDate(undefined);
            setToDate(undefined);
            setSignupDeadlineDate(undefined);
        } catch (err) {
            console.error(err);
            setGlobalError("En ukjent feil oppstod.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[rgba(0,0,0,0.02)] to-[rgba(0,0,0,0.06)] flex justify-center px-4 py-10">
            <div className="w-full max-w-3xl">
                <Heading level="1" size="xlarge" className="text-center mb-8">
                    Opprett nytt arrangement
                </Heading>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="bg-surface-default rounded-3xl shadow-md border border-border-subtle p-6 md:p-8"
                >
                    <VStack gap="6">
                        <TextField
                            label="Tittel"
                            {...register("title")}
                            error={errors.title?.message}
                        />

                        <div>
                            <Textarea
                                label="Beskrivelse"
                                {...register("description")}
                                minRows={4}
                                placeholder="Beskriv kort hva arrangementet handler om, hvem det passer for osv."
                                error={errors.description?.message}
                            />
                        </div>

                        <TextField
                            label="Livestream URL (valgfritt)"
                            {...register("videoUrl")}
                            placeholder="https://..."
                            error={errors.videoUrl?.message}
                        />
                        <TextField
                            label="Thumbnail URL (valgfritt)"
                            {...register("thumbnailPath")}
                            placeholder="https://..."
                            error={errors.thumbnailPath?.message}
                        />

                        <HGrid gap="6" columns={{ xs: 1, md: 2 }}>
                            <Fieldset legend="Fra">
                                <VStack gap="3">
                                    <DatePicker {...fromDatepicker.datepickerProps}>
                                        <DatePicker.Input
                                            {...fromDatepicker.inputProps}
                                            label="Startdato"
                                            placeholder="dd.mm.åååå"
                                            error={startDateTimeError}
                                        />
                                    </DatePicker>

                                    <TextField
                                        label="Starttid"
                                        type="time"
                                        {...register("fromTime")}
                                        error={errors.fromTime?.message || startDateTimeError}
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
                                            error={endDateTimeError}
                                        />
                                    </DatePicker>

                                    <TextField
                                        label="Slutttid"
                                        type="time"
                                        {...register("toTime")}
                                        error={errors.toTime?.message || endDateTimeError}
                                    />
                                </VStack>
                            </Fieldset>
                        </HGrid>

                        <TextField
                            label="Lokasjon"
                            {...register("location")}
                            error={errors.location?.message}
                        />

                        <Checkbox {...register("isPublic")}>
                            Arrangementet er offentlig
                        </Checkbox>

                        <VStack gap="3">
                            <Checkbox {...register("limitParticipants")}>
                                Maks antall deltakere
                            </Checkbox>

                            {limitParticipants && (
                                <TextField
                                    label="Antall"
                                    type="number"
                                    min={1}
                                    {...register("participantLimit")}
                                    error={errors.participantLimit?.message}
                                />
                            )}
                        </VStack>

                        <VStack gap="3">
                            <Checkbox {...register("hasSignupDeadline")}>
                                Påmeldingsfrist
                            </Checkbox>

                            {hasSignupDeadline && (
                                <HGrid gap="4" columns={{ xs: 1, md: 2 }}>
                                    <DatePicker {...signupDatepicker.datepickerProps}>
                                        <DatePicker.Input
                                            {...signupDatepicker.inputProps}
                                            label="Fristdato"
                                            placeholder="dd.mm.åååå"
                                            error={signupDeadlineError}
                                        />
                                    </DatePicker>

                                    <TextField
                                        label="Fristtid"
                                        type="time"
                                        {...register("signupDeadlineTime")}
                                        error={
                                            errors.signupDeadlineTime?.message ||
                                            signupDeadlineError
                                        }
                                    />
                                </HGrid>
                            )}
                        </VStack>

                        {globalError && (
                            <BodyLong className="text-red-600">{globalError}</BodyLong>
                        )}
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
