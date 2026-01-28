"use client";

import {DatePicker, DateValidationT, useDatepicker} from "@navikt/ds-react";
import {useMemo, useState} from "react";

type Props = {
    legend: string;
    label: string;
    value?: Date;
    onChange: (date?: Date) => void;

    placeholder?: string;
    error?: string;

    minDate?: Date;
    maxDate?: Date;
    hideLabel?: boolean;
};

function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

export default function EventDatePicker({label, value, onChange, placeholder = "dd.mm.åååå", error, minDate, maxDate, hideLabel = false,}: Props) {
    const [validationError, setValidationError] =
        useState<DateValidationT | null>(null);

    const min = useMemo(() => startOfDay(minDate ?? new Date()), [minDate]);

    const {datepickerProps, inputProps} = useDatepicker({
        defaultSelected: value,
        onDateChange: (date) => onChange(date ?? undefined),
        onValidate: (v) => setValidationError(v),

        fromDate: min,
        disabled: [{before: min}],

        toDate: maxDate,
    });

    const mergedError =
        error ?? (validationError?.isInvalid ? "Ugyldig dato" : undefined);

    return (
        <div>
            <DatePicker {...datepickerProps}>
                <DatePicker.Input
                    {...inputProps}
                    hideLabel={hideLabel}
                    label={label}
                    placeholder={placeholder}
                    error={mergedError}
                />
            </DatePicker>
        </div>
    );
}
