interface OffHoursBandProps {
    top: number;
    height: number;
}

export const OffHoursBand = ({ top, height }: OffHoursBandProps) => {
    return (
        <div
            className="absolute left-0 right-0 pointer-events-none z-1"
            style={{
                top,
                height,
                background: 'rgba(0,0,0,0.55)',
                backgroundImage:
                    'linear-gradient(135deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 50%, ' +
                    'rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.05) 75%, transparent 75%)',
                backgroundSize: '8px 8px',
            }}
        />
    );
};
