interface CardEmptyProps {
    text: string;
}

export const CardEmpty = ({ text }: CardEmptyProps) => (
    <div className="rounded-[10px] border border-dashed border-foreground/14 p-4 text-center text-[12px] leading-[1.45] text-muted-foreground">
        {text}
    </div>
);
