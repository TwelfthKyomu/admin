'use client';

import { useState } from 'react';
import { ROUTES } from '@/shared/constants';
import { runAction } from '@/shared/lib/action-result';
import { type InviteView, useAcceptProjectInvite } from '@/contexts/projectInvite';
import { Button, InputOTP, InputOTPGroup, InputOTPSlot } from '@/ui/Base';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useRouter } from 'next/navigation';
import { PreviewHeader } from './PreviewHeader';
import { Shell } from './Shell';

const CODE_LENGTH = 6;

interface CodeFormProps {
    token: string;
    preview: InviteView;
}

export const CodeForm = ({ token, preview }: CodeFormProps) => {
    const router = useRouter();
    const accept = useAcceptProjectInvite();
    const [code, setCode] = useState('');
    const [done, setDone] = useState(false);

    const onAccept = async () => {
        const { success, response } = await runAction(accept.mutateAsync({ token, code }), {
            success: 'Вы присоединились к проекту',
        });

        if (!success) return;

        setDone(true);
        const projectId = response?.data?.projectId;

        if (projectId) router.push(ROUTES.project(projectId));
    };

    const ready = code.length === CODE_LENGTH && !accept.isPending && !done;

    let buttonLabel = 'Принять приглашение';

    if (accept.isPending) buttonLabel = 'Принимаем…';
    else if (done) buttonLabel = 'Готово';

    return (
        <Shell>
            <PreviewHeader preview={preview} />
            <p className="mt-2 text-sm text-muted-foreground">
                Введите 6-значный код из приглашения, чтобы присоединиться.
            </p>

            <div className="mt-5 flex justify-center">
                <InputOTP
                    maxLength={CODE_LENGTH}
                    pattern={REGEXP_ONLY_DIGITS}
                    value={code}
                    onChange={setCode}
                    disabled={accept.isPending || done}
                >
                    <InputOTPGroup>
                        {Array.from({ length: CODE_LENGTH }, (_, i) => (
                            <InputOTPSlot
                                key={i}
                                index={i}
                            />
                        ))}
                    </InputOTPGroup>
                </InputOTP>
            </div>

            <Button
                className="mt-5 w-full"
                disabled={!ready}
                onClick={onAccept}
            >
                {buttonLabel}
            </Button>
        </Shell>
    );
};
