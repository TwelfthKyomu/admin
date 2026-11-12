export const messageStatus = (
    own: boolean,
    pending: boolean,
    read: boolean,
): 'read' | 'sent' | undefined => {
    if (!own || pending) return undefined;

    return read ? 'read' : 'sent';
};
