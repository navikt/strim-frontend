"use client";

import { useState } from "react";
import {BodyLong, Button, Checkbox, Fieldset, Heading, HGrid,
    Textarea, TextField, VStack, UNSAFE_Combobox,
} from "@navikt/ds-react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toLocalDateTimeString } from "@/utils/dateTimeUtils";
import type { EventDTO } from "@/types/event";
import EventDatePicker from "@/app/components/EventDatePicker";
import TilbakeKnapp from "@/app/components/tilbake";
import {useDateTimeValidation} from "@/utils/useDateTimeValidation";
import {useCategories} from "@/utils/useCategories";
import {defaultFormValues, EventFormValues, eventSchema} from "@/utils/eventSchema";

export default function CreateEventPage() {
    const router = useRouter();

    const [fromDate, setFromDate] = useState<Date | undefined>();
    const [toDate, setToDate] = useState<Date | undefined>();
    const [signupDeadlineDate, setSignupDeadlineDate] = useState<Date | undefined>();

    const { categories, loading: loadingCategories, error: categoriesError } = useCategories();
    const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([]);
    const categoryOptions = categories.map((c) => c.name);

    const [submitting, setSubmitting] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const {
        register, handleSubmit, watch, formState: { errors }, setError, reset,
    } = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        mode: "onChange",
        defaultValues: defaultFormValues,
    });

    const fromTime = watch("fromTime");
    const toTime = watch("toTime");
    const hasSignupDeadline = watch("hasSignupDeadline");
    const signupDeadlineTime = watch("signupDeadlineTime");
    const limitParticipants = watch("limitParticipants");

    const { startDateTimeError, endDateTimeError, signupDeadlineError } = useDateTimeValidation({
        fromDate, toDate, fromTime, toTime,
        hasSignupDeadline, signupDeadlineDate, signupDeadlineTime,
    });

    const onSubmit: SubmitHandler<EventFormValues> = async (values) => {
        setGlobalError(null);
        setSuccess(false);

        const existingCategoryIds = selectedCategoryNames
            .map((name) => categories.find((c: { name: string; }) => c.name.toLowerCase() === name.toLowerCase())?.id)
            .filter((id): id is number => typeof id === "number");

        const newCategoryNames = selectedCategoryNames
            .filter((name) => !categories.some((c: { name: string; }) => c.name.toLowerCase() === name.toLowerCase()));

        if (!fromDate) { setError("fromTime", { type: "manual", message: "Du må velge startdato." }); return; }
        if (!toDate) { setError("toTime", { type: "manual", message: "Du må velge sluttdato." }); return; }
        if (hasSignupDeadline && !signupDeadlineDate) {
            setError("signupDeadlineTime", { type: "manual", message: "Du må velge dato for påmeldingsfrist." }); return;
        }
        if (startDateTimeError) { setError("fromTime", { type: "manual", message: startDateTimeError }); return; }
        if (endDateTimeError) { setError("toTime", { type: "manual", message: endDateTimeError }); return; }
        if (signupDeadlineError) { setError("signupDeadlineTime", { type: "manual", message: signupDeadlineError }); return; }

        const startTime = toLocalDateTimeString(fromDate, values.fromTime);
        const endTime = toLocalDateTimeString(toDate, values.toTime);
        const signupDeadlineStr = hasSignupDeadline && signupDeadlineDate && values.signupDeadlineTime
            ? toLocalDateTimeString(signupDeadlineDate, values.signupDeadlineTime) : null;

        if (!startTime || !endTime) { setGlobalError("Noe gikk galt med dato/tid. Prøv igjen."); return; }

        const payload: EventDTO = {
            title: values.title.trim(),
            description: values.description.trim(),
            videoUrl: values.videoUrl?.trim() || null,
            startTime, endTime,
            location: values.location.trim(),
            isPublic: values.isPublic,
            participantLimit: values.limitParticipants ? Number(values.participantLimit || 0) : 0,
            signupDeadline: signupDeadlineStr,
            thumbnailPath: values.thumbnailPath?.trim() || null,
            categoryIds: existingCategoryIds,
            categoryNames: newCategoryNames,
        };

        try {
            setSubmitting(true);
            const res = await fetch("/api/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            if (!res.ok) { setGlobalError("Klarte ikke å opprette arrangement. Prøv igjen."); return; }

            setSuccess(true);
            reset(defaultFormValues);
            setSelectedCategoryNames([]);
            setFromDate(undefined);
            setToDate(undefined);
            setSignupDeadlineDate(undefined);
            router.push("/");
        } catch { setGlobalError("En ukjent feil oppstod."); }
        finally { setSubmitting(false); }
    };

    const hasNewTags = selectedCategoryNames.some(
        (name) => !categories.some((c: { name: string; }) => c.name.toLowerCase() === name.toLowerCase())
    );

    return (
        <div className="min-h-screen flex justify-center px-4 py-10">
            <div className="w-full max-w-3xl">
                <div className="relative mb-8">
                    <TilbakeKnapp />
                    <Heading level="1" size="xlarge" className="text-center">Opprett nytt arrangement</Heading>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="bg-surface-default rounded-3xl shadow-md border border-border-subtle p-6 md:p-8">
                    <VStack gap="6">
                        <TextField label="Tittel" {...register("title")} error={errors.title?.message} />
                        <Textarea label="Beskrivelse" {...register("description")} minRows={4} error={errors.description?.message} />

                        <div>
                            <UNSAFE_Combobox label="Kategorier (valgfritt)" shouldAutocomplete allowNewValues isMultiSelect
                                             options={categoryOptions} selectedOptions={selectedCategoryNames} disabled={loadingCategories}
                                             onToggleSelected={(opt, sel) => setSelectedCategoryNames((p) => sel ? [...p, opt] : p.filter((c) => c !== opt))} />
                            {hasNewTags && <BodyLong size="small" className="text-text-subtle mt-1">Nye tags opprettes først når arrangementet opprettes.</BodyLong>}
                            {categoriesError && <BodyLong className="text-red-600">{categoriesError}</BodyLong>}
                        </div>

                        <TextField label="Livestream URL (valgfritt)" {...register("videoUrl")} error={errors.videoUrl?.message} />
                        <TextField label="Thumbnail URL (valgfritt)" {...register("thumbnailPath")} error={errors.thumbnailPath?.message} />

                        <HGrid gap="6" columns={{ xs: 1, md: 2 }}>
                            <Fieldset legend="Fra">
                                <VStack gap="3">
                                    <EventDatePicker legend="Fra" label="Startdato" value={fromDate} onChange={setFromDate} error={startDateTimeError} />
                                    <TextField label="Starttid" type="time" {...register("fromTime")} error={errors.fromTime?.message || startDateTimeError} />
                                </VStack>
                            </Fieldset>
                            <Fieldset legend="Til">
                                <VStack gap="3">
                                    <EventDatePicker legend="Til" label="Sluttdato" value={toDate} onChange={setToDate} error={endDateTimeError} minDate={fromDate} />
                                    <TextField label="Slutttid" type="time" {...register("toTime")} error={errors.toTime?.message || endDateTimeError} />
                                </VStack>
                            </Fieldset>
                        </HGrid>

                        <TextField label="Lokasjon" {...register("location")} error={errors.location?.message} />
                        <Checkbox {...register("isPublic")}>Arrangementet er offentlig</Checkbox>

                        <VStack gap="3">
                            <Checkbox {...register("limitParticipants")}>Maks antall deltakere</Checkbox>
                            {limitParticipants && <TextField label="Antall" type="number" min={1} {...register("participantLimit")} error={errors.participantLimit?.message} />}
                        </VStack>

                        <VStack gap="3">
                            <Checkbox {...register("hasSignupDeadline")}>Påmeldingsfrist</Checkbox>
                            {hasSignupDeadline && (
                                <HGrid gap="4" columns={{ xs: 1, md: 2 }}>
                                    <EventDatePicker legend="Påmeldingsfrist" label="Fristdato" value={signupDeadlineDate} onChange={setSignupDeadlineDate} error={signupDeadlineError} maxDate={fromDate} />
                                    <TextField label="Fristtid" type="time" {...register("signupDeadlineTime")} error={errors.signupDeadlineTime?.message || signupDeadlineError} />
                                </HGrid>
                            )}
                        </VStack>

                        {globalError && <BodyLong className="text-red-600">{globalError}</BodyLong>}
                        {success && <BodyLong className="text-green-600">Arrangementet ble opprettet!</BodyLong>}

                        <div className="pt-2"><Button type="submit" loading={submitting}>Opprett</Button></div>
                    </VStack>
                </form>
            </div>
        </div>
    );
}
