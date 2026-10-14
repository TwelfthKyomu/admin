import { ORGANIZATION_ROLE_LABEL } from '@/shared/labels/team';
import type { ChatContactView } from '@/contexts/chat';
import { Button, Spinner } from '@/ui/Base';
import { MessageSquare } from 'lucide-react';
import { CardEmpty } from './Empty';
import { CardHero } from './Hero';
import { CardRows } from './Rows';
import { CardSection } from './Section';

interface CardPersonProps {
    person?: ChatContactView;
    isPending: boolean;
    canWrite: boolean;
    onWrite: () => void;
}

export const CardPerson = ({ person, isPending, canWrite, onWrite }: CardPersonProps) => {
    if (isPending) {
        return (
            <div className="flex justify-center py-6">
                <Spinner />
            </div>
        );
    }

    if (!person) return <CardEmpty text="Участник больше не состоит в организации." />;

    return (
        <>
            <CardHero
                name={person.name}
                caption={ORGANIZATION_ROLE_LABEL[person.role]}
                image={person.image}
                seed={person.id}
                action={
                    canWrite && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-1 gap-1.5"
                            onClick={onWrite}
                        >
                            <MessageSquare className="size-3.5" />
                            Написать лично
                        </Button>
                    )
                }
            />
            <CardSection title="Профиль">
                <CardRows
                    rows={[
                        { label: 'Почта', value: person.email },
                        { label: 'Роль', value: ORGANIZATION_ROLE_LABEL[person.role] },
                    ]}
                />
            </CardSection>
        </>
    );
};
