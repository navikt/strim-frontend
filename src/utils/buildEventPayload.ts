import { toLocalDateTimeString } from "@/utils/dateTimeUtils";
import type { EventDTO } from "@/types/event";
import type { EventFormValues } from "@/utils/eventSchema";
import type { CategoryDTO } from "@/types/category";

interface BuildPayloadParams {
    values: EventFormValues;
    fromDate: Date;
    toDate: Date;
    signupDeadlineDate?: Date;
    selectedCategoryNames: string[];
    categories: CategoryDTO[];
}

export function buildEventPayload({
                                      values,
                                      fromDate,
                                      toDate,
                                      signupDeadlineDate,
                                      selectedCategoryNames,
                                      categories,
                                  }: BuildPayloadParams): EventDTO | null {
    const existingCategoryIds = selectedCategoryNames
        .map((name) => categories.find((c) => c.name.toLowerCase() === name.toLowerCase())?.id)
        .filter((id): id is number => typeof id === "number");

    const newCategoryNames = selectedCategoryNames
        .filter((name) => !categories.some((c) => c.name.toLowerCase() === name.toLowerCase()));

    const startTime = toLocalDateTimeString(fromDate, values.fromTime);
    const endTime = toLocalDateTimeString(toDate, values.toTime);
    const signupDeadlineStr = values.hasSignupDeadline && signupDeadlineDate && values.signupDeadlineTime
        ? toLocalDateTimeString(signupDeadlineDate, values.signupDeadlineTime)
        : null;

    if (!startTime || !endTime) return null;

    return {
        title: values.title.trim(),
        description: values.description.trim(),
        videoUrl: values.videoUrl?.trim() || null,
        startTime,
        endTime,
        location: values.location.trim(),
        isPublic: values.isPublic,
        participantLimit: values.limitParticipants ? Number(values.participantLimit || 0) : 0,
        signupDeadline: signupDeadlineStr,
        thumbnailPath: values.thumbnailPath?.trim() || null,
        categoryIds: existingCategoryIds,
        categoryNames: newCategoryNames,
    };
}
