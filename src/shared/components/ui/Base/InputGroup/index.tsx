'use client';

import type { ComponentProps, ReactNode } from 'react';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from './primitives';

export * from './primitives';

type InputGroupFieldProps = ComponentProps<typeof InputGroupInput> & {
    startAddon?: ReactNode;
    endAddon?: ReactNode;
    groupClassName?: string;
};

function renderAddon(content: ReactNode) {
    return typeof content === 'string' ? <InputGroupText>{content}</InputGroupText> : content;
}

export const InputGroupField = ({
    startAddon,
    endAddon,
    groupClassName,
    className,
    ...props
}: InputGroupFieldProps) => {
    return (
        <InputGroup className={groupClassName}>
            {startAddon != null && (
                <InputGroupAddon align="inline-start">{renderAddon(startAddon)}</InputGroupAddon>
            )}
            <InputGroupInput
                className={className}
                {...props}
            />
            {endAddon != null && (
                <InputGroupAddon align="inline-end">{renderAddon(endAddon)}</InputGroupAddon>
            )}
        </InputGroup>
    );
};
