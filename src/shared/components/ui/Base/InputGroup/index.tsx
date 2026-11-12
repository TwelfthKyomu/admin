'use client';

import type { ComponentProps, ReactNode } from 'react';
import { AddonContent } from './components/AddonContent';
import { InputGroup, InputGroupAddon, InputGroupInput } from './primitives';

export * from './primitives';

type InputGroupFieldProps = ComponentProps<typeof InputGroupInput> & {
    startAddon?: ReactNode;
    endAddon?: ReactNode;
    groupClassName?: string;
};

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
                <InputGroupAddon align="inline-start">
                    <AddonContent content={startAddon} />
                </InputGroupAddon>
            )}
            <InputGroupInput
                className={className}
                {...props}
            />
            {endAddon != null && (
                <InputGroupAddon align="inline-end">
                    <AddonContent content={endAddon} />
                </InputGroupAddon>
            )}
        </InputGroup>
    );
};
