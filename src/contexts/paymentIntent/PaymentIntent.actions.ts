'use server';

import { db } from '@/infrastructure/database/client';
import {
    projectMutationAction,
    projectReadAction,
} from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { insertOne } from '@/shared/api/repository';
import { encryptCredentials } from '@/shared/security/encryption';
import { IntegrationType } from '@/contexts/integration/Integration.types';
import { projectIntegrations } from '@/contexts/integration/Integrations.table';
import { Permission } from '@/contexts/user/User.types';
import { and, desc, eq } from 'drizzle-orm';
import { startOnlinePayment } from './PaymentIntent.lib';
import {
    ConnectPaymentProviderActionInputSchema,
    CreatePaymentIntentActionInputSchema,
    PaymentIntentsActionInputSchema,
    RefundUnappliedIntentActionInputSchema,
} from './PaymentIntent.schema';
import { PaymentProvider } from './PaymentIntent.types';
import { refundUnappliedIntent } from './PaymentIntentRefund.lib';
import { type PaymentIntentView, paymentIntents } from './PaymentIntents.table';

function unappliedRefundDate(metadata: Record<string, unknown>): Date | null {
    const refund = metadata.refund;

    if (typeof refund !== 'object' || refund === null || !('at' in refund)) {
        return null;
    }

    return typeof refund.at === 'string' ? new Date(refund.at) : null;
}

export const paymentIntentsAction = projectReadAction(Permission.VIEW_FINANCES)
    .inputSchema(PaymentIntentsActionInputSchema)
    .action(
        async ({
            parsedInput: { projectId, orderId },
        }): Promise<PaymentIntentView[]> => {
            const filters = [eq(paymentIntents.projectId, projectId)];

            if (orderId) filters.push(eq(paymentIntents.orderId, orderId));

            const rows = await db
                .select({
                    intent: paymentIntents,
                    provider: projectIntegrations.provider,
                })
                .from(paymentIntents)
                .innerJoin(
                    projectIntegrations,
                    eq(projectIntegrations.id, paymentIntents.integrationId),
                )
                .where(and(...filters))
                .orderBy(desc(paymentIntents.createdAt));

            return rows.flatMap(({ intent, provider }) =>
                provider
                    ? [
                          {
                              id: intent.id,
                              orderId: intent.orderId,
                              amount: intent.amount,
                              currency: intent.currency,
                              status: intent.status,
                              confirmationUrl: intent.confirmationUrl,
                              createdAt: intent.createdAt,
                              provider,
                              applyError:
                                  typeof intent.metadata.applyError === 'string'
                                      ? intent.metadata.applyError
                                      : null,
                              refundedAt: unappliedRefundDate(intent.metadata),
                          },
                      ]
                    : [],
            );
        },
    );

export const connectPaymentProviderAction = projectMutationAction(
    Permission.MANAGE_INTEGRATIONS,
    'payment:connect',
)
    .inputSchema(ConnectPaymentProviderActionInputSchema)
    .action(({ parsedInput }) => {
        if (parsedInput.provider !== PaymentProvider.STRIPE) {
            throw new ApplicationError(
                'Этот платёжный провайдер пока не поддерживается',
            );
        }

        return insertOne(
            projectIntegrations,
            {
                projectId: parsedInput.projectId,
                name: parsedInput.name,
                type: IntegrationType.PAYMENT_PROVIDER,
                provider: parsedInput.provider,
                credentials: encryptCredentials(parsedInput.payload),
                isActive: true,
            },
            'Не удалось подключить платёжного провайдера',
        ).then((integration) => ({ integrationId: integration.id }));
    });

export const createPaymentIntentAction = projectMutationAction(
    Permission.MANAGE_FINANCES,
    'payment:create',
)
    .inputSchema(CreatePaymentIntentActionInputSchema)
    .action(({ parsedInput }) => startOnlinePayment(parsedInput));

export const refundUnappliedIntentAction = projectMutationAction(
    Permission.MANAGE_FINANCES,
    'payment:refund',
)
    .inputSchema(RefundUnappliedIntentActionInputSchema)
    .action(async ({ parsedInput: { id, projectId }, ctx: { userId } }) => {
        await refundUnappliedIntent(id, projectId, userId);

        return { ok: true };
    });
