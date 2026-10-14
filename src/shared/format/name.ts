interface ClientNameProps {
    firstName: string;
    lastName?: string;
    middleName?: string;
}

export function clientDisplayName(client: ClientNameProps): string {
    return [client.lastName, client.firstName, client.middleName]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(' ');
}

interface ClientContactProps extends ClientNameProps {
    email?: string;
    phone?: string;
}

export function clientLabel(client: ClientContactProps): string {
    return (
        clientDisplayName(client) || client.email || client.phone || 'Без имени'
    );
}

export function getInitials(name: string): string {
    return (
        name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('') || '?'
    );
}
