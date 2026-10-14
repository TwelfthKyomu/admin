'use client';

import { useState } from 'react';
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

interface IssuedKeyBannerProps {
    token: string;
    onDismiss: () => void;
}

export const IssuedKeyBanner = ({ token, onDismiss }: IssuedKeyBannerProps) => {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        await navigator.clipboard.writeText(token);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
    };

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
