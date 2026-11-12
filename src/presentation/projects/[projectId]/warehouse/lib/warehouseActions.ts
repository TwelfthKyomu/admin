import type { WarehouseView } from '@/contexts/warehouse';
import type { TableActionItem } from '@/ui/Base';

export interface WarehouseActionHandlers {
    onEdit: (warehouse: WarehouseView) => void;
    onMakePrimary: (warehouse: WarehouseView) => void;
    onDelete: (warehouse: WarehouseView) => void;
    isDeleting: boolean;
}

export const warehouseActionItems = (
    warehouse: WarehouseView,
    isPrimary: boolean,
    { onEdit, onMakePrimary, onDelete, isDeleting }: WarehouseActionHandlers,
): TableActionItem[] => {
    return [
        { key: 'edit', label: 'Изменить', onSelect: () => onEdit(warehouse) },
        ...(isPrimary
            ? []
            : [
                  {
                      key: 'primary',
                      label: 'Сделать основным',
                      onSelect: () => onMakePrimary(warehouse),
                  },
              ]),
        {
            key: 'delete',
            label: 'Удалить',
            variant: 'destructive',
            disabled: isDeleting,
            separator: true,
            onSelect: () => onDelete(warehouse),
        },
    ];
};
