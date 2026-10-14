const AVATAR_TONES = [
    'bg-blue-700',
    'bg-violet-500',
    'bg-cyan-700',
    'bg-neutral-500',
];

export function avatarTone(seed: string): string {
    let hash = 0;

    for (const char of seed)
        hash = (hash * 31 + char.charCodeAt(0)) % 1_000_003;

    return AVATAR_TONES[hash % AVATAR_TONES.length] ?? 'bg-neutral-500';
}

export function channelInitials(name: string): string {
    return `#${name.trim().charAt(0).toUpperCase()}`;
}
