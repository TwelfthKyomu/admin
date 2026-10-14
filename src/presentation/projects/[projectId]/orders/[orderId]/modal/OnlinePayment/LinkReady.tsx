'use client';

import { useModalClose } from '@/shared/lib/modal';
import { toast } from '@/shared/lib/toast';
import { Button, Input, Modal } from '@/ui/Base';
import { Copy, ExternalLink } from 'lucide-react';

export const LinkReady = ({ url }: { url: string }) => {
    const close = useModalClose();

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Скопировано');
        } catch {
            toast.error('Не удалось скопировать');
        }
    };

    return (
        <Modal
            onClose={close}
            title="Онлайн-оплата"
            description="Ссылка готова. Отправь её клиенту."
            className="max-w-md"
        >
            <div className="grid gap-3">
                <div className="flex items-center gap-2">
                    <Input
                        readOnly
                        value={url}
                        className="font-mono text-[12px]"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Скопировать"
                        onClick={copy}
                    >
                        <Copy className="size-4" />
                    </Button>
                    <Button
                        asChild
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Открыть"
                    >
                        <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <ExternalLink className="size-4" />
                        </a>
                    </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                    Автоматического подтверждения пока нет. Когда клиент оплатит, отметь оплату по
                    заказу вручную.
                </p>
                <Modal.Footer>
                    <Button
                        type="button"
                        onClick={close}
                    >
                        Закрыть
                    </Button>
                </Modal.Footer>
            </div>
        </Modal>
    );
};
