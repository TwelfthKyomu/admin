import type { ChatTypingUser } from '../hooks/useChatTyping';

export const typingLabel = (typists: ChatTypingUser[]): string => {
    if (typists.length === 1) return `${typists[0]?.name} печатает…`;

    if (typists.length <= 3) {
        return `${typists.map((user) => user.name).join(', ')} печатают…`;
    }

    return `${typists.length} участников печатают…`;
};

export const sameUsers = (a: ChatTypingUser[], b: ChatTypingUser[]) => {
    return (
        a.length === b.length &&
        a.every((user, index) => user.userId === b[index]?.userId)
    );
};
