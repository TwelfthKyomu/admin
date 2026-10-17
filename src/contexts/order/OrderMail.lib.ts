import 'server-only';

import { createElement } from 'react';
import { db } from '@/infrastructure/database/client';
import { sendEmail } from '@/infrastructure/email/sendEmail';
import {
    OrderEmail,
    type OrderEmailProps,
} from '@/infrastructure/email/templates/OrderEmail';
import { getErrorMessage } from '@/shared/lib/errors';
import { deliveries } from '@/contexts/delivery/Deliveries.table';
import { DeliveryStatus } from '@/contexts/delivery/Delivery.types';
import { projectIntegrations } from '@/contexts/integration/Integrations.table';
import { isOrganizationManager } from '@/contexts/organizationMember/OrganizationMember.types';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { canInProject } from '@/contexts/project/Project.types';
import { projects } from '@/contexts/project/Projects.table';
import { projectMembers } from '@/contexts/projectMember/ProjectMembers.table';
import { Permission } from '@/contexts/user/User.types';
import { users } from '@/contexts/user/Users.table';
import { env } from '@/env';
import { and, eq, isNull } from 'drizzle-orm';
import { loadOrderItems } from './Order.lib';
import { OrderEventType, orderNumber, PaymentStatus } from './Order.types';
import {
    adminOrderUrl,
    type CustomerMailContent,
    customerFooter,
    customerOrderAction,
    type MailOrder,
    orderLines,
    paidContent,
    placedContent,
    reminderContent,
    shippedContent,
    teamDetails,
} from './OrderMail.types';
import { type OrderRecord, orderEvents, orders } from './Orders.table';

const PLATFORM_NAME = 'Flowsy';

async function findOrderStorefront(
    orderId: string,
): Promise<MailOrder['storefront']> {
    const [created] = await db
        .select({ payload: orderEvents.payload })
        .from(orderEvents)
        .where(
            and(
                eq(orderEvents.orderId, orderId),
                eq(orderEvents.type, OrderEventType.CREATED),
            ),
        )
        .limit(1);

    const integrationId = created?.payload.integrationId;

    if (
        created?.payload.source !== 'storefront' ||
        typeof integrationId !== 'string'
    ) {
        return null;
    }

    const [integration] = await db
        .select({ siteUrl: projectIntegrations.siteUrl })
        .from(projectIntegrations)
        .where(eq(projectIntegrations.id, integrationId))
        .limit(1);

    return { siteUrl: integration?.siteUrl ?? null };
}

async function loadMailOrder(orderId: string): Promise<MailOrder | undefined> {
    const [row] = await db
        .select({ order: orders, projectName: projects.name })
        .from(orders)
        .innerJoin(projects, eq(projects.id, orders.projectId))
        .where(eq(orders.id, orderId))
        .limit(1);

    if (!row) return undefined;

    const [items, storefront] = await Promise.all([
        loadOrderItems(orderId),
        findOrderStorefront(orderId),
    ]);

    return { ...row, items, storefront };
}

async function findOrderManagerEmails(
    order: Pick<OrderRecord, 'projectId' | 'organizationId'>,
): Promise<string[]> {
    const [organizationRows, projectRows] = await Promise.all([
        db
            .select({ email: users.email, role: organizationMembers.role })
            .from(organizationMembers)
            .innerJoin(users, eq(users.id, organizationMembers.userId))
            .where(
                and(
                    eq(
                        organizationMembers.organizationId,
                        order.organizationId,
                    ),
                    isNull(organizationMembers.leftAt),
                ),
            ),
        db
            .select({ email: users.email, role: projectMembers.role })
            .from(projectMembers)
            .innerJoin(users, eq(users.id, projectMembers.userId))
            .where(
                and(
                    eq(projectMembers.projectId, order.projectId),
                    isNull(projectMembers.leftAt),
                ),
            ),
    ]);

    return [
        ...new Set([
            ...organizationRows
                .filter((row) => isOrganizationManager(row.role))
                .map((row) => row.email),
            ...projectRows
                .filter((row) =>
                    canInProject(row.role, Permission.MANAGE_BOOKINGS),
                )
                .map((row) => row.email),
        ]),
    ];
}

function sendOrderEmail(
    to: string,
    fromName: string,
    props: OrderEmailProps,
): Promise<void> {
    return sendEmail({
        to,
        subject: `${props.heading} — ${props.brand}`,
        fromName,
        react: createElement(OrderEmail, props),
    });
}

async function notifyCustomer(
    mail: MailOrder,
    content: CustomerMailContent,
): Promise<void> {
    if (!mail.order.customerEmail) return;

    await sendOrderEmail(mail.order.customerEmail, mail.projectName, {
        brand: mail.projectName,
        heading: content.heading,
        intro: content.intro,
        details: content.details ?? [],
        ...orderLines(mail),
        action: content.action ?? customerOrderAction(mail),
        footer: customerFooter(mail.projectName),
    });
}

async function notifyTeam(mail: MailOrder, heading: string): Promise<void> {
    const emails = await findOrderManagerEmails(mail.order);

    const props: OrderEmailProps = {
        brand: mail.projectName,
        heading,
        details: teamDetails(mail.order),
        ...orderLines(mail),
        action: {
            label: 'Открыть в админке',
            url: adminOrderUrl(env.NEXT_PUBLIC_APP_URL, mail.order),
        },
        footer: `Уведомление ${PLATFORM_NAME} о заказах проекта «${mail.projectName}».`,
    };

    await Promise.all(
        emails.map((email) => sendOrderEmail(email, PLATFORM_NAME, props)),
    );
}

async function safely(task: () => Promise<void>): Promise<void> {
    try {
        await task();
    } catch (error) {
        console.error('Order mail failed:', getErrorMessage(error));
    }
}

export function mailOrderPlaced(orderId: string): Promise<void> {
    return safely(async () => {
        const mail = await loadMailOrder(orderId);

        if (!mail) return;

        await Promise.all([
            notifyCustomer(mail, placedContent(mail.order)),
            notifyTeam(mail, `Новый заказ № ${orderNumber(mail.order)}`),
        ]);
    });
}

export function mailOrderPaid(orderId: string): Promise<void> {
    return safely(async () => {
        const mail = await loadMailOrder(orderId);

        if (!mail || mail.order.paymentStatus !== PaymentStatus.PAID) return;

        await Promise.all([
            notifyCustomer(mail, paidContent(mail.order)),
            mail.storefront
                ? notifyTeam(
                      mail,
                      `Новый заказ № ${orderNumber(mail.order)} оплачен`,
                  )
                : undefined,
        ]);
    });
}

export function mailOrderShipped(deliveryId: string): Promise<void> {
    return safely(async () => {
        const [delivery] = await db
            .select()
            .from(deliveries)
            .where(eq(deliveries.id, deliveryId))
            .limit(1);

        if (delivery?.status !== DeliveryStatus.PICKED_UP) return;

        const mail = await loadMailOrder(delivery.orderId);

        if (!mail) return;

        await notifyCustomer(mail, shippedContent(mail.order, delivery));
    });
}

export function mailOrderReminder(orderId: string): Promise<void> {
    return safely(async () => {
        const mail = await loadMailOrder(orderId);
        const scheduledAt = mail?.order.scheduledAt;

        if (!mail || !scheduledAt) return;

        await notifyCustomer(
            mail,
            reminderContent({ ...mail.order, scheduledAt }),
        );
    });
}
