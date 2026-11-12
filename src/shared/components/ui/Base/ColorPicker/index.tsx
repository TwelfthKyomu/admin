'use client';

import { Input } from '@/ui/Base/Input';
import {
    PopoverContent,
    Popover as PopoverRoot,
    PopoverTrigger,
} from '@/ui/Base/Popover/primitives';
import { ColorPanel } from './components/ColorPanel';
import { FALLBACK_COLOR } from './lib/palette';

interface ColorPickerProps {
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    id?: string;
    invalid?: boolean;
    placeholder?: string;
}

export const ColorPicker = ({
    value,
    onChange,
    onBlur,
    id,
    invalid,
    placeholder = FALLBACK_COLOR,
}: ColorPickerProps) => (
    <div className="flex items-center gap-2">
        <PopoverRoot>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label="Выбрать цвет"
                    className="size-9 shrink-0 rounded-md border shadow-xs transition-shadow hover:ring-2 hover:ring-ring/30"
                    style={{ backgroundColor: value || FALLBACK_COLOR }}
                />
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-64 p-3"
            >
                <ColorPanel
                    value={value}
                    onChange={onChange}
                />
            </PopoverContent>
        </PopoverRoot>
        <Input
            id={id}
            aria-invalid={invalid}
            value={value}
            placeholder={placeholder}
            className="font-mono"
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
        />
    </div>
);
