import { MessageSquare } from 'lucide-react';

export const ThreadEmpty = () => (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-[22px] py-7 text-center">
        <MessageSquare
            className="size-[22px] text-muted-foreground"
            strokeWidth={1.8}
        />
        <p className="text-[12.5px] leading-normal text-muted-foreground">
            Тред не выбран. Наведите на сообщение и нажмите иконку списка, чтобы обсудить его
            отдельно.
        </p>
    </div>
);
