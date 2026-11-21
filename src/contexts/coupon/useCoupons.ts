'use client';

import { defineResource } from '@/shared/lib/resource';
import {
    couponsAction,
    createCouponAction,
    deleteCouponAction,
    redeemCouponAction,
    updateCouponAction,
} from './Coupon.actions';

const coupons = defineResource({
    key: ['coupons'],
    list: {
        action: couponsAction,
        input: (projectId: string) => ({ projectId }),
        enabled: (projectId) => projectId.length > 0,
    },
    mutations: {
        useCreateCoupon: createCouponAction,
        useUpdateCoupon: updateCouponAction,
        useDeleteCoupon: deleteCouponAction,
        useRedeemCoupon: redeemCouponAction,
    },
});

export const {
    useList: useCouponsList,
    mutations: {
        useCreateCoupon,
        useUpdateCoupon,
        useDeleteCoupon,
        useRedeemCoupon,
    },
} = coupons;
