import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import { type OrderEmailItem, OrderItems } from './OrderItems';
import * as styles from './styles';

export interface OrderEmailAction {
    label: string;
    url: string;
}

export interface OrderEmailProps {
    brand: string;
    heading: string;
    intro?: string;
    details: string[];
    items: OrderEmailItem[];
    discount?: string;
    total: string;
    action?: OrderEmailAction;
    footer: string;
}

export const OrderEmail = ({
    brand,
    heading,
    intro,
    details,
    items,
    discount,
    total,
    action,
    footer,
}: OrderEmailProps) => (
    <Html lang="ru">
        <Head />
        <Preview>{intro ?? heading}</Preview>
        <Body style={styles.body}>
            <Container style={styles.container}>
                <Text style={styles.brand}>{brand}</Text>
                <Heading
                    as="h1"
                    style={styles.heading}
                >
                    {heading}
                </Heading>
                {intro && <Text style={styles.intro}>{intro}</Text>}

                {details.length > 0 && (
                    <Section>
                        {details.map((line) => (
                            <Text
                                key={line}
                                style={styles.detail}
                            >
                                {line}
                            </Text>
                        ))}
                    </Section>
                )}

                <Hr style={styles.divider} />
                <OrderItems
                    items={items}
                    discount={discount}
                    total={total}
                />

                {action && (
                    <Button
                        href={action.url}
                        style={styles.button}
                    >
                        {action.label}
                    </Button>
                )}

                <Text style={styles.footer}>{footer}</Text>
            </Container>
        </Body>
    </Html>
);
