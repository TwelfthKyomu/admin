'use client';

import type { InviteView } from '@/contexts/projectInvite';
import { Button, InputOTP, InputOTPGroup, InputOTPSlot } from '@/ui/Base';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useCodeForm } from '../hooks/useCodeForm';
import { CODE_LENGTH } from '../lib/code';
import { PreviewHeader } from './PreviewHeader';
import { Shell } from './Shell';

interface CodeFormProps {
    token: string;
    preview: InviteView;
}

export const CodeForm = ({ token, preview }: CodeFormProps) => {
    const { code, setCode, onAccept, locked, ready, buttonLabel } = useCodeForm(token);

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
                    disabled={locked}
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
