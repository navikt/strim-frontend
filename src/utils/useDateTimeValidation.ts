import { combineDateAndTime } from "@/utils/dateTimeUtils";

interface DateTimeValidationParams {
    fromDate?: Date;
    toDate?: Date;
    fromTime?: string;
    toTime?: string;
    hasSignupDeadline: boolean;
    signupDeadlineDate?: Date;
    signupDeadlineTime?: string;
}

interface DateTimeErrors {
    startDateTimeError?: string;
    endDateTimeError?: string;
    signupDeadlineError?: string;
}

export function useDateTimeValidation(params: DateTimeValidationParams): DateTimeErrors {
    const { fromDate, toDate, fromTime, toTime, hasSignupDeadline, signupDeadlineDate, signupDeadlineTime } = params;

    const now = new Date();
    const start = combineDateAndTime(fromDate, fromTime);
    const end = combineDateAndTime(toDate, toTime);
    const deadline = hasSignupDeadline ? combineDateAndTime(signupDeadlineDate, signupDeadlineTime) : null;

    const errors: DateTimeErrors = {};

    if (start && start < now) {
        errors.startDateTimeError = "Starttid kan ikke være i fortiden.";
    }

    if (start && end && end <= start) {
        errors.endDateTimeError = "Slutttid må være etter starttid.";
    }

    if (deadline) {
        if (deadline < now) {
            errors.signupDeadlineError = "Påmeldingsfrist kan ikke være i fortiden.";
        } else if (start && deadline >= start) {
            errors.signupDeadlineError = "Påmeldingsfrist må være før starttid.";
        }
    }

    return errors;
}
