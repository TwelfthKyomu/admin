import { CURRENCY_VALUES } from '@/shared/constants/currency';
import { CHAT_CHANNEL_TYPE_VALUES } from '@/contexts/chat/Chat.types';
import {
    COUPON_DISCOUNT_TYPE_VALUES,
    COUPON_STATUS_VALUES,
} from '@/contexts/coupon/Coupon.types';
import {
    DELIVERY_CARRIER_VALUES,
    DELIVERY_KIND_VALUES,
    DELIVERY_STATUS_VALUES,
} from '@/contexts/delivery/Delivery.types';
import { EMPLOYEE_KIND_VALUES } from '@/contexts/employeeAssignment/EmployeeAssignment.types';
import {
    SHIFT_CANCEL_REASON_VALUES,
    SHIFT_STATUS_VALUES,
} from '@/contexts/employeeShift/EmployeeShift.types';
import { INTEGRATION_TYPE_VALUES } from '@/contexts/integration/Integration.types';
import {
    ORDER_EVENT_TYPE_VALUES,
    ORDER_STATUS_VALUES,
    ORDER_TYPE_VALUES,
    PAYMENT_STATUS_VALUES,
} from '@/contexts/order/Order.types';
import { ORGANIZATION_ROLE_VALUES } from '@/contexts/organizationMember/OrganizationMember.types';
import {
    PAYMENT_DIRECTION_VALUES,
    PAYMENT_METHOD_VALUES,
} from '@/contexts/payment/Payment.types';
import {
    PAYMENT_INTENT_STATUS_VALUES,
    PAYMENT_PROVIDER_VALUES,
} from '@/contexts/paymentIntent/PaymentIntent.types';
import {
    PRODUCT_STATUS_VALUES,
    PRODUCT_TYPE_VALUES,
} from '@/contexts/product/Product.types';
import {
    PROJECT_ROLE_VALUES,
    PROJECT_TYPE_VALUES,
} from '@/contexts/project/Project.types';
import { PROJECT_CATEGORY_TYPE_VALUES } from '@/contexts/projectCategory/ProjectCategory.types';
import { STOCK_MOVEMENT_REASON_VALUES } from '@/contexts/stockMovement/StockMovement.types';
import {
    BILLING_PAYMENT_STATUS_VALUES,
    SUBSCRIPTION_PLAN_VALUES,
} from '@/contexts/subscription/Subscription.types';
import {
    TASK_PRIORITY_VALUES,
    TASK_STATUS_VALUES,
} from '@/contexts/task/Task.types';
import { pgEnum } from 'drizzle-orm/pg-core';

export const currencyEnum = pgEnum('currency', CURRENCY_VALUES);

export const organizationRoleEnum = pgEnum(
    'organization_role',
    ORGANIZATION_ROLE_VALUES,
);

export const projectRoleEnum = pgEnum('project_role', PROJECT_ROLE_VALUES);

export const projectTypeEnum = pgEnum('project_type', PROJECT_TYPE_VALUES);

export const subscriptionPlanEnum = pgEnum(
    'subscription_plan',
    SUBSCRIPTION_PLAN_VALUES,
);

export const billingPaymentStatusEnum = pgEnum(
    'billing_payment_status',
    BILLING_PAYMENT_STATUS_VALUES,
);

export const projectCategoryTypeEnum = pgEnum(
    'project_category_type',
    PROJECT_CATEGORY_TYPE_VALUES,
);

export const productStatusEnum = pgEnum(
    'product_status',
    PRODUCT_STATUS_VALUES,
);

export const productTypeEnum = pgEnum('product_type', PRODUCT_TYPE_VALUES);

export const stockMovementReasonEnum = pgEnum(
    'stock_movement_reason',
    STOCK_MOVEMENT_REASON_VALUES,
);

export const integrationTypeEnum = pgEnum(
    'integration_type',
    INTEGRATION_TYPE_VALUES,
);

export const employeeKindEnum = pgEnum('employee_kind', EMPLOYEE_KIND_VALUES);

export const deliveryKindEnum = pgEnum('delivery_kind', DELIVERY_KIND_VALUES);

export const deliveryStatusEnum = pgEnum(
    'delivery_status',
    DELIVERY_STATUS_VALUES,
);

export const deliveryCarrierEnum = pgEnum(
    'delivery_carrier',
    DELIVERY_CARRIER_VALUES,
);

export const shiftStatusEnum = pgEnum('shift_status', SHIFT_STATUS_VALUES);

export const shiftCancelReasonEnum = pgEnum(
    'shift_cancel_reason',
    SHIFT_CANCEL_REASON_VALUES,
);

export const orderTypeEnum = pgEnum('order_type', ORDER_TYPE_VALUES);

export const orderStatusEnum = pgEnum('order_status', ORDER_STATUS_VALUES);

export const paymentStatusEnum = pgEnum(
    'payment_status',
    PAYMENT_STATUS_VALUES,
);

export const orderEventTypeEnum = pgEnum(
    'order_event_type',
    ORDER_EVENT_TYPE_VALUES,
);

export const paymentIntentStatusEnum = pgEnum(
    'payment_intent_status',
    PAYMENT_INTENT_STATUS_VALUES,
);

export const paymentProviderEnum = pgEnum(
    'payment_provider',
    PAYMENT_PROVIDER_VALUES,
);

export const paymentMethodEnum = pgEnum(
    'payment_method',
    PAYMENT_METHOD_VALUES,
);

export const paymentDirectionEnum = pgEnum(
    'payment_direction',
    PAYMENT_DIRECTION_VALUES,
);

export const couponDiscountTypeEnum = pgEnum(
    'coupon_discount_type',
    COUPON_DISCOUNT_TYPE_VALUES,
);

export const couponStatusEnum = pgEnum('coupon_status', COUPON_STATUS_VALUES);

export const taskStatusEnum = pgEnum('task_status', TASK_STATUS_VALUES);
export const taskPriorityEnum = pgEnum('task_priority', TASK_PRIORITY_VALUES);

export const chatChannelTypeEnum = pgEnum(
    'chat_channel_type',
    CHAT_CHANNEL_TYPE_VALUES,
);
