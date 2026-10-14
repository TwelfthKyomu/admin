import { Input, PasswordInput } from '@/ui/Controlled';

interface BaseInputProps {
    newPassword?: boolean;
}

export const BaseInput = ({ newPassword }: BaseInputProps) => (
    <>
        <Input
            label="Электронная почта"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="your@email.com"
        />
        <PasswordInput
            label="Пароль"
            name="password"
            autoComplete={newPassword ? 'new-password' : 'current-password'}
        />
    </>
);
