'use client';

import { makeScopedMutation } from '@/shared/lib/mutations';
import { listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    couponsAction,
    createCouponAction,
    deleteCouponAction,
    redeemCouponAction,
    updateCouponAction,
} from './Coupon.actions';

const couponQueries = {
    all: ['coupons'] as const,
    list: (projectId: string) =>
        listQuery(
            [...couponQueries.all, 'list', projectId],
            () => couponsAction({ projectId }),
            { enabled: projectId.length > 0 },
        ),
};

export function useCouponsList(projectId: string) {
    return useQuery(couponQueries.list(projectId));
}

export const useCreateCoupon = makeScopedMutation(createCouponAction);
export const useUpdateCoupon = makeScopedMutation(updateCouponAction);
export const useDeleteCoupon = makeScopedMutation(deleteCouponAction);
export const useRedeemCoupon = makeScopedMutation(redeemCouponAction);
