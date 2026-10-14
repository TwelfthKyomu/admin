import { FieldGroup } from '@/ui/Base';
import { Input } from '@/ui/Controlled';

export const ClientForm = () => (
    <FieldGroup>
        <div className="grid grid-cols-2 gap-3">
            <Input
                name="firstName"
                label="Имя"
                placeholder="Анна"
                autoFocus
            />
            <Input
                name="lastName"
                label="Фамилия"
                placeholder="Необязательно"
            />
        </div>
        <Input
            name="middleName"
            label="Отчество"
            placeholder="Необязательно"
        />
        <div className="grid grid-cols-2 gap-3">
            <Input
                name="phone"
                label="Телефон"
                placeholder="+7 900 000-00-00"
            />
            <Input
                name="email"
                label="Email"
                type="email"
                placeholder="anna@example.com"
            />
        </div>
    </FieldGroup>
);
