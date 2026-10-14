import { ROUTES } from '@/shared/constants';
import { absoluteUrl } from '@/shared/format/url';
import { IntegrationType, type IntegrationView } from '@/contexts/integration';
import { Badge, Button } from '@/ui/Base';
import { createColumnHelper } from '@tanstack/react-table';

const { display, accessor } = createColumnHelper<IntegrationView>();

interface ColumnsProps {
    onRevoke: (integration: IntegrationView) => void;
    isRevoking: boolean;
}

export const COLUMNS = ({ onRevoke, isRevoking }: ColumnsProps) => [
    accessor('name', {
        header: 'Название',
    }),
    accessor('siteUrl', {
        header: 'Сайт',
        cell: ({ getValue }) => {
            const url = getValue();

            if (!url) return '—';

            return (
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                >
                    {url}
                </a>
            );
        },
    }),
    display({
        id: 'prefix',
        header: 'Ключ / адрес уведомлений',
        cell: ({ row: { original } }) =>
            original.type === IntegrationType.PAYMENT_PROVIDER ? (
                <code
                    className="select-all break-all"
                    title="Укажите этот адрес в кабинете провайдера как URL для уведомлений"
                >
                    {absoluteUrl(ROUTES.paymentWebhook(original.id))}
                </code>
            ) : (
                <code>{original.apiKeyPrefix ?? '—'}</code>
            ),
    }),
    display({
        id: 'status',
        header: 'Статус',
        cell: ({ row: { original } }) => (
            <Badge variant={original.isActive ? 'default' : 'outline'}>
                {original.isActive ? 'Активен' : 'Отозван'}
            </Badge>
        ),
    }),
    display({
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row: { original } }) => {
            if (!original.isActive) return null;

            return (
                <div className="flex justify-end gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        disabled={isRevoking}
                        onClick={() => onRevoke(original)}
                    >
                        Отозвать
                    </Button>
                </div>
            );
        },
    }),
];
