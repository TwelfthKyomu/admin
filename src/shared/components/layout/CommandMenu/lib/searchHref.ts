interface NamedProject {
    id: string;
    name: string;
}

export const withQuery = (href: string, query: string): string =>
    `${href}?${new URLSearchParams({ q: query })}`;

export const projectNameOf = (projects: NamedProject[], id: string): string =>
    projects.find((project) => project.id === id)?.name ?? '';
