import { Badge } from '@/ui/Base/Badge';
import { Table } from '@/ui/Base/Table';
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';

interface OrderRow {
    id: string;
    customer: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    total: number;
}

const STATUS_VARIANT: Record<OrderRow['status'], 'default' | 'secondary' | 'destructive'> = {
    pending: 'secondary',
    confirmed: 'secondary',
    completed: 'default',
    cancelled: 'destructive',
};

const DATA: OrderRow[] = [
    { id: 'ORD-1001', customer: 'Иван Петров', status: 'completed', total: 1590 },
    { id: 'ORD-1002', customer: 'Анна Смирнова', status: 'pending', total: 4200 },
    { id: 'ORD-1003', customer: 'Пётр Козлов', status: 'confirmed', total: 890 },
    { id: 'ORD-1004', customer: 'Мария Иванова', status: 'cancelled', total: 3300 },
    { id: 'ORD-1005', customer: 'Олег Соколов', status: 'completed', total: 12750 },
    { id: 'ORD-1006', customer: 'Елена Волкова', status: 'pending', total: 640 },
    { id: 'ORD-1007', customer: 'Дмитрий Орлов', status: 'confirmed', total: 5100 },
    { id: 'ORD-1008', customer: 'Ольга Морозова', status: 'completed', total: 2280 },
];

const columns: ColumnDef<OrderRow>[] = [
    { accessorKey: 'id', header: 'Заказ' },
    { accessorKey: 'customer', header: 'Клиент' },
    {
        accessorKey: 'status',
        header: 'Статус',
        cell: ({ getValue }) => {
            const status = getValue<OrderRow['status']>();

            return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
        },
    },
    {
        accessorKey: 'total',
        header: 'Сумма',
        cell: ({ getValue }) => `${getValue<number>().toLocaleString('ru-RU')} ₽`,
    },
];

const OrdersTable = Table<OrderRow>;

const meta = {
    title: 'Base/Table',
    component: OrdersTable,
    parameters: { layout: 'padded' },
    args: {
        data: DATA,
        columns,
        enableSorting: true,
        enablePagination: true,
        enableRowSelection: true,
    },
} satisfies Meta<typeof OrdersTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutFeatures: Story = {
    args: {
        enableSorting: false,
        enablePagination: false,
        enableRowSelection: false,
    },
};

export const Loading: Story = {
    args: { data: [], isLoading: true },
};

export const Empty: Story = {
    args: { data: [] },
};
