import { ROUTES } from '@/shared/constants';
import { absoluteUrl } from '@/shared/format/url';
import { copyToClipboard } from '@/shared/lib/clipboard';

export const copyInviteLink = (token: string, success = 'Ссылка скопирована') =>
    copyToClipboard(absoluteUrl(ROUTES.invite(token)), success);
