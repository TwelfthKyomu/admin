interface ChannelChipProps {
    direct: boolean;
}

export const ChannelChip = ({ direct }: ChannelChipProps) => (
    <span className="shrink-0 rounded-[4px] bg-violet-500/20 px-[5px] py-[3px] font-mono text-[9.5px] leading-none font-medium tracking-[0.04em] text-violet-300">
        {direct ? 'ЛС' : 'КАНАЛ'}
    </span>
);
