"use client";
import React, { useState, useEffect } from 'react';
import Read from '@/devcrud/read';
import Create from '@/devcrud/create';
import Delete from '@/devcrud/delete';

interface App {
    app_id: string;
    app_name: string;
    app_owner: string;
    is_active: boolean;
    created_at: string;
}

export default function MainSection() {
    const [apps, setApps] = useState<App[]>([]);
    const [error, setError] = useState<string | null>(null);

    async function fetchApps() {
        try {
            const response = await fetch('/api/read');

            if (!response.ok) {
                let message = `Network response was not ok: ${response.status}`;

                try {
                    const contentType = response.headers.get('content-type') ?? '';
                    if (contentType.includes('application/json')) {
                        const errorData = await response.json().catch(() => ({}));
                        message += ` - ${errorData.detail || errorData.message || JSON.stringify(errorData)}`;
                    } else {
                        const text = await response.text().catch(() => '');
                        if (text) message += ` - ${text}`;
                    }
                } catch {
                    // ignore parsing errors
                }

                console.error(message);
                setError(message);
                return;
            }

            const data: App[] = await response.json();
            setApps(data);
            setError(null);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
        }
    }

    useEffect(() => {
        fetchApps();
    }, []);

    return (
        <div className="container mx-auto pt-6 pb-12">
            <Read apps={apps} error={error} />
            <Create onAppCreated={fetchApps} />
            <Delete onAppDeleted={fetchApps} />
        </div>
    );
}