'use client';

import { HexColorPicker } from 'react-colorful';
import { cn } from '@/shared/lib/utils';
import { COLOR_PRESETS, FALLBACK_COLOR, isSameColor } from '../lib/palette';

interface ColorPanelProps {
    value: string;
    onChange: (value: string) => void;
}

export const ColorPanel = ({ value, onChange }: ColorPanelProps) => (
    <div className="grid gap-3">
        <HexColorPicker
            color={value || FALLBACK_COLOR}
            onChange={onChange}
            style={{ width: '100%', height: 160 }}
        />
        <div className="grid grid-cols-8 gap-1.5">
            {COLOR_PRESETS.map((color) => (
                <button
                    key={color}
                    type="button"
                    aria-label={color}
                    className={cn(
                        'size-6 rounded-full border border-black/10 ring-offset-2 ring-offset-popover transition-transform hover:scale-110',
                        isSameColor(color, value) && 'ring-2 ring-ring',
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => onChange(color)}
                />
            ))}
        </div>
    </div>
);
