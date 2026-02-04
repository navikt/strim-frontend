"use client";

import { useState } from "react";
import { Alert, Button, VStack } from "@navikt/ds-react";
import { BellIcon } from "@navikt/aksel-icons";

type Props = {
    eventId: string;
    disabled?: boolean;
    size?: "small" | "medium";
    className?: string;
};

export default function AddToCalendarButton({
                                                eventId,
                                                disabled = false,
                                                size = "medium",
                                                className,
                                            }: Props) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    async function handleClick() {
        setLoading(true);
        setStatus("idle");

        try {
            const res = await fetch(`/api/events/${eventId}/calendar-invite`, {
                method: "POST",
            });

            if (!res.ok) {
                setStatus("error");
                return;
            }

            setStatus("success");
        } catch {
            setStatus("error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <VStack gap="2" className={className}>
            <Button
                type="button"
                variant="secondary"
                size={size}
                icon={<BellIcon aria-hidden />}
                loading={loading}
                disabled={disabled || loading || status === "success"}
                onClick={handleClick}
            >
                {status === "success" ? "Invitasjon sendt" : "Legg til i kalender"}
            </Button>

            {status === "success" && (
                <Alert variant="success" size="small">
                    Invitasjon er sendt til Outlook.
                </Alert>
            )}

            {status === "error" && (
                <Alert variant="error" size="small">
                    Klarte ikke å sende invitasjon. Prøv igjen.
                </Alert>
            )}
        </VStack>
    );
}
