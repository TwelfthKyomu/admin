const TASK_TITLE_PREVIEW = 120;

export const taskTitleFromMessage = (body: string): string => {
    const line = body
        .split('\n')
        .map((part) => part.trim())
        .find(Boolean);

    return line ? line.slice(0, TASK_TITLE_PREVIEW) : 'Задача из чата';
};

export const taskKeyLabel = (projectKey: string, number: number): string => {
    return `${projectKey}-${number}`;
};
