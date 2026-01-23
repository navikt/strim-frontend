import type { EventDetailsDTO } from "@/types/event";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, { ...init, cache: "no-store", credentials: "include" });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText} ${text}`);
    }
    return (await res.json()) as T;
}

export function getEventDetails(eventId: string) {
    return fetchJson<EventDetailsDTO>(`/api/events/${eventId}/details`, { method: "GET" });
}

export function joinEvent(eventId: string) {
    return fetchJson<EventDetailsDTO>(`/api/events/${eventId}/join`, { method: "POST" });
}

export function leaveEvent(eventId: string) {
    return fetchJson<EventDetailsDTO>(`/api/events/${eventId}/join`, { method: "DELETE" });
}

