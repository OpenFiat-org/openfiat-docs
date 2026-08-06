---
title: TypeScript
---

# TypeScript SDK

`@openfiat/sdk` ([`openfiat-sdks/typescript`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/typescript)) —
عميل مطبوع لـ[واجهة JSON-RPC](../api) لعقدة، إضافةً إلى توقيع محفظة
Ed25519 (عبر `@noble/ed25519`، متوافق مع `ed25519-dalek` في حزمة Rust —
بذرة المحفظة نفسها تنتج المفاتيح والتواقيع نفسها في أي من اللغتين) ودعم
جسر سلسلة Solana. آمن للمتصفح/الحافة بالتصميم؛ ويعيش إدخال/إخراج ملف
المحفظة الخاص بـ Node فقط في نقطة دخول منفصلة `@openfiat/sdk/node`.

## التثبيت

قبل 1.0 ولم يُنشر على npm بعد — اعتمد عليه كاعتمادية git، مثبَّتة إلى
commit:

```bash
pnpm add "github:OpenFiat-org/openfiat-sdks#<commit>&path:typescript"
```

## بداية سريعة

```typescript
import { Client } from "@openfiat/sdk";

const client = new Client({ endpoint: "http://localhost:7080", timeoutMs: 30_000 });
const version = await client.call("getVersion", {});
```

تُجمَّع الطرق المطبوعة في وحدة لكل مجال — `node`، `chain`، `oracles`،
`providers`، `advertisements`، `reservations`، `notifications`:

```typescript
import { node } from "@openfiat/sdk";

const version = await node.getVersion(client);
```

## توقيع كتابة وتقديمها

يأخذ كل طريقة `sendX` كائن حدث المجال الخاص إضافةً إلى `Keypair` — تبني
الحزمة الحمولة الموقَّعة وتقدّمها؛ لا تُنشئ عقدة أو توقّع شيئًا نيابةً
عنك قط:

```typescript
import { generateKeypair, oracles } from "@openfiat/sdk";

const keypair = await generateKeypair(); // أو keypairFromSeed(...) / loadWalletFile(...) من "@openfiat/sdk/node"
const oracleId = await oracles.sendOraclePublish(client, publish, keypair);
```

## أمثلة

كل مثال في [`typescript/examples`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/typescript/examples)
يعمل ضد عقدة حقيقية ويغطّيه اختبار في `tests/live_node.test.ts`، يُشغَّل
في CI ضد عملية `openfiat-node` فعلية (انظر مهمة `typescript-sdk-live-node`
في `.github/workflows/ci.yml`) — فمثال معطوب يُفشل البناء تمامًا كما
يُفشله اختبار معطوب:

- [`basic.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/basic.ts) — أنشئ عميلًا.
- [`oracle_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/oracle_provider.ts) — سجّل كمزوّد أوراكل، انشر سعرًا.
- [`notification_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/notification_provider.ts) — سجّل كمزوّد إشعارات، أبلغ عن تسليم.
- [`trading_bot.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/trading_bot.ts) — انشر إعلانًا، افتح حجزًا عليه.
- [`solana_transaction.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/solana_transaction.ts) — وقّع وقدّم معاملة Solana حقيقية عبر جسر السلسلة.

شغّل أيًا منها ضد عقدة محلية:

```bash
# الطرفية 1 — من openfiat-core
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080

# الطرفية 2 — من openfiat-sdks/typescript
pnpm tsx examples/trading_bot.ts
```
