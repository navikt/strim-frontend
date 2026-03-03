export function combineDateAndTime(date?: Date, time?: string): Date | null {
    if (!date || !time) return null;
    const [hours, minutes] = time.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
}

export function toLocalDateTimeString(date?: Date, time?: string): string | null {
    if (!date || !time) return null;

    const [hours, minutes] = time.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}T${time}:00`;
}
