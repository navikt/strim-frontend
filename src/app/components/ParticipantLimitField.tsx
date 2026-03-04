import { Checkbox, TextField, VStack } from "@navikt/ds-react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { EventFormValues } from "@/utils/eventSchema";

interface ParticipantLimitFieldProps {
    register: UseFormRegister<EventFormValues>;
    errors: FieldErrors<EventFormValues>;
    limitParticipants: boolean;
}

export default function ParticipantLimitField({ register, errors, limitParticipants }: ParticipantLimitFieldProps) {
    return (
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
    );
}
