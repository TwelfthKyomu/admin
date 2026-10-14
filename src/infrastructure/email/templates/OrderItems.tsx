import { Column, Row, Section, Text } from '@react-email/components';
import * as styles from './styles';

export interface OrderEmailItem {
    name: string;
    quantity: number;
    total: string;
}

interface OrderItemsProps {
    items: OrderEmailItem[];
    discount?: string;
    total: string;
}

export const OrderItems = ({ items, discount, total }: OrderItemsProps) => (
    <Section>
        {items.map((item) => (
            <Row key={`${item.name}:${item.quantity}:${item.total}`}>
                <Column>
                    <Text style={styles.itemName}>
                        {item.name} × {item.quantity}
                    </Text>
                </Column>
                <Column>
                    <Text style={styles.itemAmount}>{item.total}</Text>
                </Column>
            </Row>
        ))}

        {discount && (
            <Row>
                <Column>
                    <Text style={styles.itemName}>Скидка</Text>
                </Column>
                <Column>
                    <Text style={styles.itemAmount}>−{discount}</Text>
                </Column>
            </Row>
        )}

        <Row>
            <Column>
                <Text style={styles.totalLabel}>Итого</Text>
            </Column>
            <Column>
                <Text style={styles.totalAmount}>{total}</Text>
            </Column>
        </Row>
    </Section>
);
