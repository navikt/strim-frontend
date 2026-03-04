import { Checkbox, HGrid, TextField, VStack } from "@navikt/ds-react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import EventDatePicker from "@/app/components/EventDatePicker";
import { EventFormValues } from "@/utils/eventSchema";

interface SignupDeadlineFieldsProps {
    register: UseFormRegister<EventFormValues>;
    errors: FieldErrors<EventFormValues>;
    hasSignupDeadline: boolean;
    signupDeadlineDate: Date | undefined;
    setSignupDeadlineDate: (d: Date | undefined) => void;
    signupDeadlineError: string | null;
    maxDate?: Date;
}

export default function SignupDeadlineFields({register, errors, hasSignupDeadline, signupDeadlineDate,
                                                 setSignupDeadlineDate, signupDeadlineError, maxDate,}: SignupDeadlineFieldsProps) {
    return (
        <VStack gap="3">
            <Checkbox {...register("hasSignupDeadline")}>Påmeldingsfrist</Checkbox>
            {hasSignupDeadline && (
                <HGrid gap="4" columns={{ xs: 1, md: 2 }}>
                    <EventDatePicker
                        legend="Påmeldingsfrist"
                        label="Fristdato"
                        value={signupDeadlineDate}
                        onChange={setSignupDeadlineDate}
                        error={signupDeadlineError ?? undefined}
                        maxDate={maxDate}
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
    );
}
