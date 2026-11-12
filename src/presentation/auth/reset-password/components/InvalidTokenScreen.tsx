import { ROUTES } from '@/shared/constants';
import { Button } from '@/ui/Base';
import Link from 'next/link';

export const InvalidTokenScreen = () => (
    <div className="flex flex-col gap-3 text-center">
        <p className="text-sm text-muted-foreground">
            Ссылка для сброса пароля недействительна или устарела. Запросите новую на странице
            входа.
        </p>
        <Button asChild>
            <Link href={ROUTES.auth}>К странице входа</Link>
        </Button>
    </div>
);
