'use client';

import {
    Button,
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Input,
} from '@/ui/Base';
import { Check, Copy } from 'lucide-react';
import { useIssuedKeyBanner } from '../hooks/useIssuedKeyBanner';

interface IssuedKeyBannerProps {
    token: string;
    onDismiss: () => void;
}

export const IssuedKeyBanner = ({ token, onDismiss }: IssuedKeyBannerProps) => {
    const { copied, copy } = useIssuedKeyBanner(token);

    return (
        <Card
            role="status"
            aria-live="polite"
        >
            <CardHeader>
                <CardTitle>Ключ выпущен</CardTitle>
                <CardDescription>
                    Сохраните его сейчас — после закрытия страницы посмотреть будет нельзя.
                </CardDescription>
                <CardAction>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onDismiss}
                    >
                        Закрыть
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap items-center gap-3">
                    <Input
                        readOnly
                        value={token}
                        className="min-w-[16rem] flex-1 font-mono"
                        aria-label="Выпущенный API-ключ"
                    />
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={copy}
                        className="ml-auto shrink-0"
                    >
                        {copied ? (
                            <>
                                <Check
                                    className="size-3.5"
                                    aria-hidden
                                />
                                Скопировано
                            </>
                        ) : (
                            <>
                                <Copy
                                    className="size-3.5"
                                    aria-hidden
                                />
                                Скопировать
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
