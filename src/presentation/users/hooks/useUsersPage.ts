'use client';

import { useCallback } from 'react';
import { useStaticData } from '@/app/providers';
import { runAction } from '@/shared/lib/action-result';
import { confirmDestructive } from '@/shared/lib/modal';
import {
    canInOrg,
    type OrganizationMemberView,
    OrganizationRole,
    useChangeOrganizationMemberRole,
    useOffboardOrganizationMember,
    useOrganizationMembersList,
} from '@/contexts/organizationMember';
import { Permission } from '@/contexts/user';

export function useUsersPage() {
    const { organization, user } = useStaticData();
    const query = useOrganizationMembersList(organization.id);
    const changeRole = useChangeOrganizationMemberRole();
    const offboard = useOffboardOrganizationMember();

    const canManageMember = useCallback(
        (targetMember: OrganizationMemberView, permission: Permission) => {
            if (!canInOrg(organization.role, permission)) return false;
            if (targetMember.user.id === user.id) return false;
            if (targetMember.role === OrganizationRole.OWNER) return false;

            if (targetMember.role === OrganizationRole.ADMIN) {
                return organization.role === OrganizationRole.OWNER;
            }

            return true;
        },
        [organization.role, user.id],
    );

    const canChangeRole = useCallback(
        (member: OrganizationMemberView) =>
            canManageMember(member, Permission.MANAGE_ROLES),
        [canManageMember],
    );

    const canOffboard = useCallback(
        (member: OrganizationMemberView) =>
            canManageMember(member, Permission.MANAGE_MEMBERS),
        [canManageMember],
    );

    const onOffboard = (member: OrganizationMemberView) =>
        confirmDestructive({
            title: 'Уволить из организации?',
            description: `${member.user.name} потеряет доступ ко всем проектам и выйдет из расписаний. Вернуть можно новым приглашением.`,
            confirmLabel: 'Уволить',
            success: 'Участник уволен',
            onConfirm: () =>
                offboard.mutateAsync({
                    organizationId: organization.id,
                    memberId: member.id,
                }),
        });

    const onChangeRole = async (memberId: string, role: OrganizationRole) => {
        await runAction(
            changeRole.mutateAsync({
                organizationId: organization.id,
                memberId,
                role,
            }),
            { success: 'Роль изменена' },
        );
    };

    return {
        query,
        currentUserId: user.id,
        isMutating: changeRole.isPending || offboard.isPending,
        canChangeRole,
        onChangeRole,
        canOffboard,
        onOffboard,
    };
}
