import { z } from "zod";

const urlOrEmpty = z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
        (v) => !v || v === "" || /^https?:\/\/.+/i.test(v),
        "Må være en gyldig URL (må starte med http eller https)"
    );

export const eventSchema = z
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
        videoUrl: urlOrEmpty,
        thumbnailPath: urlOrEmpty,
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

        if (values.hasSignupDeadline && !values.signupDeadlineTime) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["signupDeadlineTime"],
                message: "Du må sette tidspunkt for påmeldingsfrist.",
            });
        }
    });

export type EventFormValues = z.infer<typeof eventSchema>;

export const defaultFormValues: EventFormValues = {
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
};
