export interface EventDTO {
    id?: string;
    title: string;
    description: string;
    videoUrl: string | null;
    thumbnailPath: string | null;
    startTime: string;
    endTime: string;
    location: string;
    isPublic: boolean;
    participantLimit: number;
    signupDeadline: string | null;
    categoryIds: number[];
    categoryNames: string[];

}
