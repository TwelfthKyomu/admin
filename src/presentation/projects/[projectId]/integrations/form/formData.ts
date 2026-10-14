import { LABEL_MAX, TITLE_MAX, TOKEN_MAX } from '@/shared/constants/default';
import { CreateIntegrationActionInputSchema } from '@/contexts/integration';
import { PaymentProvider } from '@/contexts/paymentIntent';
import * as z from 'zod/mini';

export const CreateIntegrationFormSchema = z.omit(
    CreateIntegrationActionInputSchema,
    { projectId: true },
);

export type CreateIntegrationFormValues = z.input<
    typeof CreateIntegrationFormSchema
>;

export const INTEGRATION_DEFAULT: CreateIntegrationFormValues = {
    name: '',
    siteUrl: '',
};

export const ConnectPaymentProviderFormSchema = z
    .object({
        name: z
            .string()
            .check(z.minLength(1, 'Введите название'), z.maxLength(LABEL_MAX)),
        provider: z.enum([
            PaymentProvider.YOOKASSA,
            PaymentProvider.CLOUDPAYMENTS,
            PaymentProvider.STRIPE,
        ]),
        shopId: z.optional(z.string().check(z.maxLength(TITLE_MAX))),
        secretKey: z
            .string()
            .check(z.minLength(1, 'Обязательное поле'), z.maxLength(TOKEN_MAX)),
        webhookSecret: z.optional(z.string().check(z.maxLength(TOKEN_MAX))),
    })
    .check(
        z.refine(
            (data) =>
                data.provider !== PaymentProvider.YOOKASSA ||
                !!data.shopId?.trim(),
            {
                error: 'Обязательное поле',
                path: ['shopId'],
            },
        ),
    );

export type ConnectPaymentProviderFormValues = z.input<
    typeof ConnectPaymentProviderFormSchema
>;

export const CONNECT_PROVIDER_DEFAULT: ConnectPaymentProviderFormValues = {
    name: 'Stripe',
    provider: PaymentProvider.STRIPE,
    shopId: '',
    secretKey: '',
    webhookSecret: '',
};
