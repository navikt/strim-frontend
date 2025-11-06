
"use client";
import React, { useState } from "react";
import { TextField, Button, Alert, AlertProps } from "@navikt/ds-react";

interface App {
    app_id: string;
    app_name: string;
    is_active: boolean;
    created_at: string;
    app_owner?: string;
}

export default function CreateApp({ onAppCreated }: { onAppCreated: () => void }) {
    const [appName, setAppName] = useState("");
    const [isActive,] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            const response = await fetch('/api/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    app_name: appName,
                    is_active: isActive,
                    created_at: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                const contentType = response.headers.get('content-type') ?? '';
                let message = `Network response was not ok: ${response.status}`;

                if (contentType.includes('application/json')) {
                    const errorData = await response.json().catch(() => ({}));
                    message = errorData.message || errorData.detail || JSON.stringify(errorData) || message;
                } else {
                    const text = await response.text().catch(() => '');
                    if (text) message = text;
                }

                console.error('Create API error:', message);
                setError(message);
                setSuccess(false);
                return;
            }

            const data: App | null = await response.json().catch(() => null);
            if (!data) {
                setError('Failed to parse response from server');
                setSuccess(false);
                return;
            }

            console.log('App created:', data);
            setSuccess(true);
            setError(null);
            setAppName('');
            onAppCreated();
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
            setSuccess(false);
        }
    };

    return (
        <div style={{ maxWidth: "600px", marginTop: "60px" }}>
            <h1 className="text-4xl font-bold mb-8">Legg til app</h1>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 mb-5">
                <TextField
                    label="Navn"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                />
                <Button type="submit" className="max-w-[200px]" variant="primary">Legg til</Button>
            </form>
            {success && (
                <AlertWithCloseButton variant="success">
                    App lagt til
                </AlertWithCloseButton>
            )}
            {error && (
                <AlertWithCloseButton variant="error">
                    Uff, fikk ikke lagt til appen: {error}
                </AlertWithCloseButton>
            )}
        </div>
    );
}

const AlertWithCloseButton = ({
                                  children,
                                  variant,
                              }: {
    children?: React.ReactNode;
    variant: AlertProps["variant"];
}) => {
    const [show, setShow] = React.useState(true);

    return show ? (
        <Alert variant={variant} closeButton onClose={() => setShow(false)}>
            {children}
        </Alert>
    ) : null;
};
