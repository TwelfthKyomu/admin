import type { NullToOptional } from '@/shared/lib/optional';
import type {
    CashMovementView as ServerCashMovementView,
    ClosedCashShiftView as ServerClosedCashShiftView,
    CourierBalanceView as ServerCourierBalanceView,
    PaymentMethodTotalView as ServerPaymentMethodTotalView,
} from './CashShift.types';

export * from './CashShift.actions';
export * from './CashShift.schema';
export * from './CashShift.types';
export * from './useCashShifts';

export type CashMovementView = NullToOptional<ServerCashMovementView>;
export type ClosedCashShiftView = NullToOptional<ServerClosedCashShiftView>;
export type CourierBalanceView = NullToOptional<ServerCourierBalanceView>;
export type PaymentMethodTotalView =
    NullToOptional<ServerPaymentMethodTotalView>;
