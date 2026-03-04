"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCategories } from "@/utils/useCategories";
import { useCategorySelection } from "@/utils/useCategorySelection";
import { useEventDates } from "@/utils/useEventDates";
import { useEventSubmit } from "@/utils/useEventSubmit";
import { useDateTimeValidation } from "@/utils/useDateTimeValidation";
import { buildEventPayload } from "@/utils/buildEventPayload";
import { defaultFormValues, EventFormValues, eventSchema } from "@/utils/eventSchema";
import EventForm from "@/app/components/EventForm";

export default function CreateEventPage() {
    const { categories, loading: loadingCategories, error: categoriesError } = useCategories();
    const { selectedCategoryNames, setSelectedCategoryNames, categoryOptions, hasNewTags, resetSelection } = useCategorySelection(categories);
    const { fromDate, setFromDate, toDate, setToDate, signupDeadlineDate, setSignupDeadlineDate, resetDates } = useEventDates();

    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        mode: "onChange",
        defaultValues: defaultFormValues,
    });

    const { watch, handleSubmit, setError, reset } = form;
    const fromTime = watch("fromTime");
    const toTime = watch("toTime");
    const hasSignupDeadline = watch("hasSignupDeadline");
    const signupDeadlineTime = watch("signupDeadlineTime");

    const { startDateTimeError, endDateTimeError, signupDeadlineError } = useDateTimeValidation({
        fromDate, toDate, fromTime, toTime,
        hasSignupDeadline, signupDeadlineDate, signupDeadlineTime,
    });

    const { submitEvent, submitting, globalError, setGlobalError, success } = useEventSubmit({
        onSuccess: () => {
            reset(defaultFormValues);
            resetSelection();
            resetDates();
        },
    });

    const onSubmit: SubmitHandler<EventFormValues> = async (values) => {
        if (!fromDate) { setError("fromTime", { type: "manual", message: "Du må velge startdato." }); return; }
        if (!toDate) { setError("toTime", { type: "manual", message: "Du må velge sluttdato." }); return; }
        if (hasSignupDeadline && !signupDeadlineDate) {
            setError("signupDeadlineTime", { type: "manual", message: "Du må velge dato for påmeldingsfrist." }); return;
        }
        if (startDateTimeError) { setError("fromTime", { type: "manual", message: startDateTimeError }); return; }
        if (endDateTimeError) { setError("toTime", { type: "manual", message: endDateTimeError }); return; }
        if (signupDeadlineError) { setError("signupDeadlineTime", { type: "manual", message: signupDeadlineError }); return; }

        const payload = buildEventPayload({
            values, fromDate, toDate, signupDeadlineDate, selectedCategoryNames, categories,
        });

        if (!payload) {
            setGlobalError("Noe gikk galt med dato/tid. Prøv igjen.");
            return;
        }

        await submitEvent(payload);
    };

    return (
        <EventForm
            form={form}
            onSubmit={handleSubmit(onSubmit)}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
            signupDeadlineDate={signupDeadlineDate}
            setSignupDeadlineDate={setSignupDeadlineDate}
            categoryOptions={categoryOptions}
            selectedCategoryNames={selectedCategoryNames}
            setSelectedCategoryNames={setSelectedCategoryNames}
            loadingCategories={loadingCategories}
            categoriesError={categoriesError}
            hasNewTags={hasNewTags}
            startDateTimeError={startDateTimeError ?? null}
            endDateTimeError={endDateTimeError ?? null}
            signupDeadlineError={signupDeadlineError ?? null}
            globalError={globalError}
            success={success}
            submitting={submitting}
        />
    );
}
