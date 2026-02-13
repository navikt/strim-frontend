"use client";

import { useEffect, useState } from "react";
import {BodyLong, Button, Checkbox, Fieldset, Heading, HGrid, Textarea, TextField, VStack, UNSAFE_Combobox,} from "@navikt/ds-react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { EventDTO } from "@/types/event";
import type { CategoryDTO } from "@/types/category";
import EventDatePicker from "@/app/components/EventDatePicker";
import TilbakeKnapp from "@/app/components/tilbake";

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
    const router = useRouter();

    const [fromDate, setFromDate] = useState<Date | undefined>();
    const [toDate, setToDate] = useState<Date | undefined>();
    const [signupDeadlineDate, setSignupDeadlineDate] = useState<Date | undefined>();

    const [categories, setCategories] = useState<CategoryDTO[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);

    const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([]);
    const categoryOptions = categories.map((c) => c.name);

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
            thumbnailPath: "",
        },
    });

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setLoadingCategories(true);
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
            } finally {
                if (!alive) return;
                setLoadingCategories(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

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
        if (start < now) startDateTimeError = "Starttid kan ikke være i fortiden.";
    }

    if (start && end) {
        if (end <= start) endDateTimeError = "Slutttid må være etter starttid.";
    }

    if (signupDeadline) {
        if (signupDeadline < now) {
            signupDeadlineError = "Påmeldingsfrist kan ikke være i fortiden.";
        } else if (start && signupDeadline >= start) {
            signupDeadlineError = "Påmeldingsfrist må være før starttid.";
        }
    }

    const onSubmit: SubmitHandler<EventFormValues> = async (values) => {
        setGlobalError(null);
        setSuccess(false);

        const existingCategoryIds = selectedCategoryNames
            .map((name) => categories.find((c) => c.name.toLowerCase() === name.toLowerCase())?.id)
            .filter((id): id is number => typeof id === "number");

        const newCategoryNames = selectedCategoryNames
            .filter((name) => !categories.some((c) => c.name.toLowerCase() === name.toLowerCase()));

        if (!fromDate) {
            setError("fromTime", { type: "manual", message: "Du må velge startdato." });
            return;
        }
        if (!toDate) {
            setError("toTime", { type: "manual", message: "Du må velge sluttdato." });
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
            setError("signupDeadlineTime", { type: "manual", message: signupDeadlineError });
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
            videoUrl: values.videoUrl && values.videoUrl.trim() !== "" ? values.videoUrl.trim() : null,
            startTime,
            endTime,
            location: values.location.trim(),
            isPublic: values.isPublic,
            participantLimit: values.limitParticipants ? Number(values.participantLimit || 0) : 0,
            signupDeadline: signupDeadlineStr,
            thumbnailPath: values.thumbnailPath && values.thumbnailPath.trim() !== "" ? values.thumbnailPath.trim() : null,
            categoryIds: existingCategoryIds,
            categoryNames: newCategoryNames,
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
                thumbnailPath: "",
            });
            setSelectedCategoryNames([]);
            setFromDate(undefined);
            setToDate(undefined);
            setSignupDeadlineDate(undefined);

            router.push("/");
        } catch (err) {
            console.error(err);
            setGlobalError("En ukjent feil oppstod.");
        } finally {
            setSubmitting(false);
        }

    };

    const hasNewTags = selectedCategoryNames.some(
        (name) =>
            !categories.some(
                (c) => c.name.toLowerCase() === name.toLowerCase(),
            ),
    );


    return (
        <div className="min-h-screen flex justify-center px-4 py-10">
            <div className="w-full max-w-3xl">
                <div className="relative mb-8">
                    <TilbakeKnapp></TilbakeKnapp>

                    <Heading level="1" size="xlarge" className="text-center">
                        Opprett nytt arrangement
                    </Heading>
                </div>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="bg-surface-default rounded-3xl shadow-md border border-border-subtle p-6 md:p-8"
                >
                    <VStack gap="6">
                        <TextField label="Tittel" {...register("title")} error={errors.title?.message} />

                        <Textarea
                            label="Beskrivelse"
                            {...register("description")}
                            minRows={4}
                            placeholder="Beskriv kort hva arrangementet handler om, hvem det passer for osv."
                            error={errors.description?.message}
                        />

                        <div>
                            <UNSAFE_Combobox
                                label="Kategorier (valgfritt)"
                                className="max-w-prose"
                                shouldAutocomplete
                                allowNewValues
                                isMultiSelect
                                options={categoryOptions}
                                selectedOptions={selectedCategoryNames}
                                disabled={loadingCategories}
                                onToggleSelected={(option, isSelected) => {
                                    setSelectedCategoryNames((prev) =>
                                        isSelected ? [...prev, option] : prev.filter((c) => c !== option),
                                    );
                                }}
                            />
                            {hasNewTags && (
                                <BodyLong size="small" className="text-text-subtle mt-1">
                                    Nye tags opprettes først når arrangementet opprettes.
                                </BodyLong>
                            )}


                            {categoriesError && <BodyLong className="text-red-600">{categoriesError}</BodyLong>}
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
                                    <EventDatePicker
                                        legend="Fra"
                                        label="Startdato"
                                        value={fromDate}
                                        onChange={setFromDate}
                                        error={startDateTimeError}
                                    />

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
                                    <EventDatePicker
                                        legend="Til"
                                        label="Sluttdato"
                                        value={toDate}
                                        onChange={setToDate}
                                        error={endDateTimeError}
                                        minDate={fromDate}
                                    />

                                    <TextField
                                        label="Slutttid"
                                        type="time"
                                        {...register("toTime")}
                                        error={errors.toTime?.message || endDateTimeError}
                                    />
                                </VStack>
                            </Fieldset>
                        </HGrid>

                        <TextField label="Lokasjon" {...register("location")} error={errors.location?.message} />

                        <Checkbox {...register("isPublic")}>Arrangementet er offentlig</Checkbox>

                        <VStack gap="3">
                            <Checkbox {...register("limitParticipants")}>Maks antall deltakere</Checkbox>

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
                            <Checkbox {...register("hasSignupDeadline")}>Påmeldingsfrist</Checkbox>

                            {hasSignupDeadline && (
                                <HGrid gap="4" columns={{ xs: 1, md: 2 }}>
                                    <EventDatePicker
                                        legend="Påmeldingsfrist"
                                        label="Fristdato"
                                        value={signupDeadlineDate}
                                        onChange={setSignupDeadlineDate}
                                        error={signupDeadlineError}
                                        // Optional: deadline can’t be after start date
                                        maxDate={fromDate}
                                    />

                                    <TextField
                                        label="Fristtid"
                                        type="time"
                                        {...register("signupDeadlineTime")}
                                        error={errors.signupDeadlineTime?.message || signupDeadlineError}
                                    />
                                </HGrid>
                            )}
                        </VStack>

                        {globalError && <BodyLong className="text-red-600">{globalError}</BodyLong>}
                        {success && <BodyLong className="text-green-600">Arrangementet ble opprettet!</BodyLong>}

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
