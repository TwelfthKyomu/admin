import { fmtDur, fmtMinutesOfDay } from '@/shared/format/date';
import { PX_PER_MIN, STEP_MIN } from '../../constants';

interface CreatePreviewProps {
    startMin: number;
    dur: number;
}

export const CreatePreview = ({ startMin, dur }: CreatePreviewProps) => (
    <div
        className="absolute rounded-lg px-2 py-1.5 opacity-80 pointer-events-none"
        style={{
            top: startMin * PX_PER_MIN,
            height: Math.max(STEP_MIN, dur) * PX_PER_MIN,
            left: 4,
            width: 'calc(100% - 8px)',
            background: 'rgba(139,92,246,0.18)',
            border: '1px dashed rgba(139,92,246,0.6)',
            boxShadow: 'inset 3px 0 0 0 #8b5cf6',
        }}
    >
        <div className="text-[12.5px] font-semibold">Новая запись</div>
        <div className="text-[11px] opacity-75 font-mono tabular-nums">
            {fmtMinutesOfDay(startMin)} · {fmtDur(dur)}
        </div>
    </div>
);
