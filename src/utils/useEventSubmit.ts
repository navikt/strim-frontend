import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EventDTO } from "@/types/event";

interface UseEventSubmitOptions {
    onSuccess?: () => void;
}

export function useEventSubmit({ onSuccess }: UseEventSubmitOptions = {}) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const submitEvent = async (payload: EventDTO) => {
        setGlobalError(null);
        setSuccess(false);

        try {
            setSubmitting(true);
            const res = await fetch("/api/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                setGlobalError("Klarte ikke å opprette arrangement. Prøv igjen.");
                return false;
            }

            setSuccess(true);
            onSuccess?.();
            router.push("/");
            return true;
        } catch {
            setGlobalError("En ukjent feil oppstod.");
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    return { submitEvent, submitting, globalError, setGlobalError, success };
}
