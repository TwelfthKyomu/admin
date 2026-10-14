# Flowsy

Мультитенантная SaaS-платформа для управления малым бизнесом в сфере услуг и
розницы: заказы и онлайн-запись, склад и касса, смены и зарплаты сотрудников,
доставка и командный чат.

Демо: [admin.kyomu.tech](https://admin.kyomu.tech)

## Возможности

- **Организация** — несколько проектов (точек, магазинов), роли и права по
  проекту, приглашения, журнал действий, тарифы с оплатой через Stripe.
- **Продажи** — заказы и онлайн-запись на услуги, онлайн-оплата через
  провайдера проекта, наличные, возвраты, купоны, база клиентов, выручка.
- **Каталог и склад** — товары с вариантами и лимитированным тиражом, услуги,
  категории, бейджи, движение остатков.
- **Команда** — расписание смен и замены, касса смены, расчёт зарплат,
  курьеры и доставки, задачи.
- **Чат** — каналы организации и проектов, личные сообщения, треды, реакции,
  задачи из сообщений, обновления в реальном времени.
- **API витрины** — каталог, заказы и кабинет покупателя для сайта магазина по ключу проекта.

## Стек

Next.js 16 (App Router, Partial Prerender), React 19 + React Compiler,
TypeScript, PostgreSQL + Drizzle ORM, better-auth, next-safe-action,
zod/mini, react-hook-form, TanStack Query и Table, Tailwind CSS 4 + radix-ui.
Инструменты: Bun, Biome, ESLint (пустые строки между блоками), Vitest, knip, Storybook.

## Устройство кода

```text
src/
├── app/             # маршруты App Router: страницы реэкспортируют presentation
├── contexts/        # 27 доменных контекстов: таблицы, логика, server actions, хуки
├── presentation/    # UI страниц, по папке на маршрут
├── infrastructure/  # база, авторизация, почта, платежи, хранилище файлов
└── shared/          # общие компоненты, права, форматирование, валидация
```

Запрос идёт так: страница → хук страницы → хук контекста (TanStack Query) →
server action с проверкой права → `.lib.ts` → таблица Drizzle. HTTP-роуты
есть только там, где без них нельзя: авторизация, загрузка и отдача файлов,
realtime-канал (SSE), вебхуки платежей и тарифов, API витрины
`/api/storefront/v1`.

## Запуск

Нужны [Bun](https://bun.sh) и Docker.

```bash
bun install
bun run docker:up
bun run db:migrate
bun dev
```

`.env.local` (схема — `src/env.ts`):

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:55432/adminpanel
AUTH_SECRET=
ENCRYPTION_KEY=
```

`AUTH_SECRET` — `openssl rand -base64 32`, `ENCRYPTION_KEY` — ровно 32 символа
(`openssl rand -hex 16`).

## Команды

| Команда | Что делает |
| --- | --- |
| `bun dev` | dev-сервер |
| `bun run lint` | Biome и ESLint с автоисправлением |
| `bun run typecheck` | TypeScript |
| `bun run test` | Vitest |
| `bun run deadcode` | knip: неиспользуемые файлы и экспорты |
| `bun run db:generate` | миграция из изменений схемы |
| `bun run db:migrate` | применить миграции |
| `bun run build` / `start` | продакшн-сборка и запуск |

CI проверяет типы, Biome и ESLint, тесты, миграции на чистой базе и сборку.

## Продакшн

`next start` за nginx; при пуше в `main` сервер сам применяет миграции,
собирает и перезапускает приложение.

Переменные окружения: `NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_URL` (тот же адрес),
`DATABASE_URL`, `AUTH_SECRET`, `ENCRYPTION_KEY`, `UPLOADS_DIR`,
`RESEND_API_KEY` и `EMAIL_FROM` (письма), `BILLING_STRIPE_SECRET_KEY` и
`BILLING_STRIPE_WEBHOOK_SECRET` (тарифы), `TRUSTED_PROXY_IPS` (если прокси
несколько).

Что важно не забыть:

- `NEXT_PUBLIC_*` вшиваются при сборке — собирать с прод-значениями.
- Смена `AUTH_SECRET` разлогинит всех, смена `ENCRYPTION_KEY` сделает
  нечитаемыми сохранённые ключи интеграций.
- `UPLOADS_DIR` — вне каталога с кодом, иначе загрузки пропадут при выкладке.
- nginx передаёт `X-Forwarded-For` (по нему лимиты входа), разрешает тело до
  8 МБ, а для `/api/realtime` отключает буферизацию и держит соединение до часа.
