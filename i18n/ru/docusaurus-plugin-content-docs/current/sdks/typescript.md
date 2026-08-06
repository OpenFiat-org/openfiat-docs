---
title: TypeScript
---

# TypeScript SDK

`@openfiat/sdk` ([`openfiat-sdks/typescript`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/typescript)) —
типизированный клиент для [JSON-RPC-поверхности](../api) узла, плюс подпись
кошелька Ed25519 (через `@noble/ed25519`, совместимый с `ed25519-dalek` из Rust
SDK — одна и та же seed кошелька даёт одни и те же ключи и подписи в любом из
языков) и поддержка моста цепочки Solana. По дизайну безопасен для
браузера/edge; файловый ввод-вывод кошелька только для Node живёт в отдельной
точке входа `@openfiat/sdk/node`.

## Установка

До 1.0 и пока не опубликован на npm — зависите от него как от git-зависимости,
закреплённой на коммите:

```bash
pnpm add "github:OpenFiat-org/openfiat-sdks#<commit>&path:typescript"
```

## Быстрый старт

```typescript
import { Client } from "@openfiat/sdk";

const client = new Client({ endpoint: "http://localhost:7080", timeoutMs: 30_000 });
const version = await client.call("getVersion", {});
```

Типизированные методы сгруппированы по одному модулю на домен — `node`, `chain`,
`oracles`, `providers`, `advertisements`, `reservations`, `notifications`:

```typescript
import { node } from "@openfiat/sdk";

const version = await node.getVersion(client);
```

## Подпись и отправка записи

Каждый метод `sendX` принимает собственный объект события домена плюс `Keypair` —
SDK строит подписанную нагрузку и отправляет её; узел никогда ничего не
конструирует и не подписывает от вашего имени:

```typescript
import { generateKeypair, oracles } from "@openfiat/sdk";

const keypair = await generateKeypair(); // или keypairFromSeed(...) / loadWalletFile(...) из "@openfiat/sdk/node"
const oracleId = await oracles.sendOraclePublish(client, publish, keypair);
```

## Примеры

Каждый пример в [`typescript/examples`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/typescript/examples)
работает против реального узла и покрыт тестом в `tests/live_node.test.ts`,
запускаемым в CI против реального процесса `openfiat-node` (см. задачу
`typescript-sdk-live-node` в `.github/workflows/ci.yml`) — сломанный пример ломает
сборку так же, как сломанный тест:

- [`basic.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/basic.ts) — постройте клиента.
- [`oracle_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/oracle_provider.ts) — зарегистрируйтесь как поставщик оракула, опубликуйте курс.
- [`notification_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/notification_provider.ts) — зарегистрируйтесь как поставщик уведомлений, сообщите о доставке.
- [`trading_bot.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/trading_bot.ts) — опубликуйте объявление, откройте резервирование против него.
- [`solana_transaction.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/solana_transaction.ts) — подпишите и отправьте реальную транзакцию Solana через мост цепочки.

Запустите любой из них против локального узла:

```bash
# терминал 1 — из openfiat-core
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080

# терминал 2 — из openfiat-sdks/typescript
pnpm tsx examples/trading_bot.ts
```
