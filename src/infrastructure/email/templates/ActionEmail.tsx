import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Text,
} from '@react-email/components';
import * as styles from './styles';

export interface ActionEmailProps {
    brand: string;
    heading: string;
    lines: string[];
    action: { label: string; url: string };
    footer: string;
}

export const ActionEmail = ({ brand, heading, lines, action, footer }: ActionEmailProps) => (
    <Html lang="ru">
        <Head />
        <Preview>{heading}</Preview>
        <Body style={styles.body}>
            <Container style={styles.container}>
                <Text style={styles.brand}>{brand}</Text>
                <Heading
                    as="h1"
                    style={styles.heading}
                >
                    {heading}
                </Heading>
                {lines.map((line) => (
                    <Text
                        key={line}
                        style={styles.intro}
                    >
                        {line}
                    </Text>
                ))}
                <Button
                    href={action.url}
                    style={styles.button}
                >
                    {action.label}
                </Button>
                <Text style={styles.footer}>
                    Если кнопка не открывается, скопируйте ссылку в браузер: {action.url}
                </Text>
                <Text style={styles.footer}>{footer}</Text>
            </Container>
        </Body>
    </Html>
);
