'use client';

import { useMutation } from '@tanstack/react-query';
import { createOrganizationAction } from './Organization.actions';

export function useCreateOrganization() {
    return useMutation({ mutationFn: createOrganizationAction });
}
