import type { ReactNode } from 'react';
import { InputGroupText } from '../primitives';

export const AddonContent = ({ content }: { content: ReactNode }) => {
    if (typeof content === 'string') return <InputGroupText>{content}</InputGroupText>;

    return content;
};
