import { useState } from "react";

export function useEventDates() {
    const [fromDate, setFromDate] = useState<Date | undefined>();
    const [toDate, setToDate] = useState<Date | undefined>();
    const [signupDeadlineDate, setSignupDeadlineDate] = useState<Date | undefined>();

    const resetDates = () => {
        setFromDate(undefined);
        setToDate(undefined);
        setSignupDeadlineDate(undefined);
    };

    return {
        fromDate, setFromDate,
        toDate, setToDate,
        signupDeadlineDate, setSignupDeadlineDate,
        resetDates,
    };
}
