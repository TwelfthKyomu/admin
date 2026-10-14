'use client';

import { useModalClose } from '@/shared/lib/modal';
import { Button, Modal } from '@/ui/Base';

export const NoProviders = () => {
    const close = useModalClose();

    return (
        <Modal
            onClose={close}
            title="Онлайн-оплата"
            description="У этого проекта пока нет ни одного платёжного провайдера. Подключи его в разделе «Интеграции»."
            className="max-w-md"
        >
            <Modal.Footer>
                <Button
                    type="button"
                    variant="outline"
                    onClick={close}
                >
                    Закрыть
                </Button>
            </Modal.Footer>
        </Modal>
    );
};
