import {
    BodyLong, Button, Checkbox, Fieldset, Heading, HGrid,
    Textarea, TextField, VStack,
} from "@navikt/ds-react";
import { UseFormReturn } from "react-hook-form";
import EventDatePicker from "@/app/components/EventDatePicker";
import TilbakeKnapp from "@/app/components/tilbake";
import ParticipantLimitField from "@/app/components/ParticipantLimitField";
import SignupDeadlineFields from "@/app/components/SignupDeadlineFields";
import CategorySelector from "@/app/components/CategorySelector";
import { EventFormValues } from "@/utils/eventSchema";

interface EventFormProps {
    form: UseFormReturn<EventFormValues>;
    onSubmit: (e: React.FormEvent) => void;
    fromDate: Date | undefined;
    setFromDate: (d: Date | undefined) => void;
    toDate: Date | undefined;
    setToDate: (d: Date | undefined) => void;
    signupDeadlineDate: Date | undefined;
    setSignupDeadlineDate: (d: Date | undefined) => void;
    categoryOptions: string[];
    selectedCategoryNames: string[];
    setSelectedCategoryNames: React.Dispatch<React.SetStateAction<string[]>>;
    loadingCategories: boolean;
    categoriesError: string | null;
    hasNewTags: boolean;
    startDateTimeError: string | null;
    endDateTimeError: string | null;
    signupDeadlineError: string | null;
    globalError: string | null;
    success: boolean;
    submitting: boolean;
    title?: string;
    submitLabel?: string;
}

export default function EventForm({
                                      form, onSubmit, fromDate, setFromDate, toDate, setToDate,
                                      signupDeadlineDate, setSignupDeadlineDate, categoryOptions, selectedCategoryNames,
                                      setSelectedCategoryNames, loadingCategories, categoriesError, hasNewTags,
                                      startDateTimeError, endDateTimeError, signupDeadlineError, globalError, success,
                                      submitting, title = "Opprett nytt arrangement", submitLabel = "Opprett",
                                  }: EventFormProps) {
    const { register, formState: { errors }, watch } = form;
    const limitParticipants = watch("limitParticipants");
    const hasSignupDeadline = watch("hasSignupDeadline");

    return (
        <div className="min-h-screen flex justify-center px-4 py-10">
            <div className="w-full max-w-3xl">
                <div className="relative mb-8">
                    <TilbakeKnapp />
                    <Heading level="1" size="xlarge" className="text-center">{title}</Heading>
                </div>

                <form onSubmit={onSubmit} className="bg-surface-default rounded-3xl shadow-md border border-border-subtle p-6 md:p-8">
                    <VStack gap="6">
                        <TextField label="Tittel" {...register("title")} error={errors.title?.message} />
                        <Textarea label="Beskrivelse" {...register("description")} minRows={4} error={errors.description?.message} />

                        <CategorySelector
                            categoryOptions={categoryOptions}
                            selectedCategoryNames={selectedCategoryNames}
                            setSelectedCategoryNames={setSelectedCategoryNames}
                            loading={loadingCategories}
                            error={categoriesError}
                            hasNewTags={hasNewTags}
                        />

                        <TextField label="Livestream URL (valgfritt)" {...register("videoUrl")} error={errors.videoUrl?.message} />
                        <TextField label="Thumbnail URL (valgfritt)" {...register("thumbnailPath")} error={errors.thumbnailPath?.message} />

                        <HGrid gap="6" columns={{ xs: 1, md: 2 }}>
                            <Fieldset legend="Fra">
                                <VStack gap="3">
                                    <EventDatePicker legend="Fra" label="Startdato" value={fromDate} onChange={setFromDate} error={startDateTimeError ?? undefined} />
                                    <TextField label="Starttid" type="time" {...register("fromTime")} error={errors.fromTime?.message || startDateTimeError} />
                                </VStack>
                            </Fieldset>
                            <Fieldset legend="Til">
                                <VStack gap="3">
                                    <EventDatePicker legend="Til" label="Sluttdato" value={toDate} onChange={setToDate} error={endDateTimeError ?? undefined} minDate={fromDate} />
                                    <TextField label="Slutttid" type="time" {...register("toTime")} error={errors.toTime?.message || endDateTimeError} />
                                </VStack>
                            </Fieldset>
                        </HGrid>

                        <TextField label="Lokasjon" {...register("location")} error={errors.location?.message} />
                        <Checkbox {...register("isPublic")}>Arrangementet er offentlig</Checkbox>

                        <ParticipantLimitField register={register} errors={errors} limitParticipants={limitParticipants} />

                        <SignupDeadlineFields
                            register={register}
                            errors={errors}
                            hasSignupDeadline={hasSignupDeadline}
                            signupDeadlineDate={signupDeadlineDate}
                            setSignupDeadlineDate={setSignupDeadlineDate}
                            signupDeadlineError={signupDeadlineError}
                            maxDate={fromDate}
                        />

                        {globalError && <BodyLong className="text-red-600">{globalError}</BodyLong>}
                        {success && <BodyLong className="text-green-600">Arrangementet ble opprettet!</BodyLong>}

                        <div className="pt-2"><Button type="submit" loading={submitting}>{submitLabel}</Button></div>
                    </VStack>
                </form>
            </div>
        </div>
    );
}
