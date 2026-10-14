import type { NullToOptional } from '@/shared/lib/optional';
import type { CouponView as ServerCouponView } from './Coupons.table';

export * from './Coupon.actions';
export * from './Coupon.schema';
export * from './Coupon.types';
export * from './useCoupons';

export type CouponView = NullToOptional<ServerCouponView>;
