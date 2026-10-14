'use client';

import { Fragment } from 'react';
import { splitMessageText } from '@/contexts/chat';

export const MessageText = ({ body }: { body: string }) => (
    <>
        {splitMessageText(body).map((part, index) =>
            part.kind === 'link' ? (
                <a
                    key={`${index}:${part.value}`}
                    href={part.value}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={(event) => event.stopPropagation()}
                    className="underline underline-offset-2 hover:opacity-80"
                >
                    {part.value}
                </a>
            ) : (
                <Fragment key={`${index}:${part.value}`}>{part.value}</Fragment>
            ),
        )}
    </>
);
