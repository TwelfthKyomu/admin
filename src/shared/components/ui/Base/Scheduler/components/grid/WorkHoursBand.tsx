interface WorkHoursBandProps {
    top: number;
    height: number;
}

export const WorkHoursBand = ({ top, height }: WorkHoursBandProps) => {
    return (
        <div
            className="absolute left-0 right-0 pointer-events-none z-[1]"
            style={{
                top,
                height,
                background:
                    'linear-gradient(180deg, rgba(139,92,246,0.10) 0%, rgba(139,92,246,0.05) 100%)',
                boxShadow:
                    'inset 0 1px 0 0 rgba(139,92,246,0.35), inset 0 -1px 0 0 rgba(139,92,246,0.35)',
            }}
        />
    );
};
