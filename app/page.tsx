"use client";
import {useEffect, useState} from "react";
import EventRow, {EventDto} from "@/app/components/event/eventKort";

interface Event {
    id: string;
    title: string;
    description: string;
    imageUrl: string | null;
    startTime: string;
    endTime: string;
    location: string;
    isPublic: boolean;
    participantLimit: number;
    signupDeadline: string | null;
}

export default function MainSection() {
    const [events, setEvents] = useState<Event[]>([]);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = async () => {

            const response = await  fetch('/api/read');
            if (!response.ok) throw new Error(`Network error: ${response.status}`);{
                setError('An unknown error occurred');
            }
            const data: Event[] = await response.json();
            setEvents(data);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    return (
        <>
            <div className="container mx-auto pt-6 pb-12">
                <h1 className="text-xl font-bold mb-4">Events</h1>

                {error && <p className="text-red-500">{error}</p>}

                {events.length === 0 ? (
                    <p>No events found.</p>
                ) : (
                    <ul className="grid gap-6 md:grid-cols-2">
                        {events.map((e) => (
                            <EventRow key={e.id} event={e as EventDto}/>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}