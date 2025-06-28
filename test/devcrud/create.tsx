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
/*            let appOwner = "Testbruker";
            
            // Only try to fetch real user in production
            if (process.env.NODE_ENV !== 'development') {
                const userResponse = await fetch('/api/me');
                if (!userResponse.ok) {
                    throw new Error('Failed to fetch user information');
                }
                const userData = await userResponse.json();
                appOwner = userData.user.preferred_username;
            }*/

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
                const errorData = await response.json();
                throw new Error(errorData.message || `Network response was not ok: ${response.status} - ${JSON.stringify(errorData)}`);
            }
            const data: App = await response.json();
            console.log('App created:', data);
            setSuccess(true);
            setError(null);
            setAppName(''); // Clear the input field
            onAppCreated(); // Notify the parent component to update the list of apps
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