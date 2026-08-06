---
title: TypeScript
---

# TypeScript SDK

`@openfiat/sdk` ([`openfiat-sdks/typescript`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/typescript)) —
एक नोड के [JSON-RPC इंटरफ़ेस](../api) के लिए एक टाइप्ड क्लाइंट, साथ ही Ed25519
वॉलेट हस्ताक्षर (`@noble/ed25519` के माध्यम से, Rust SDK के `ed25519-dalek` के साथ
अंतर-संचालनीय — वही वॉलेट seed दोनों भाषाओं में वही कुंजियाँ और हस्ताक्षर उत्पन्न
करता है) और Solana चेन ब्रिज समर्थन। डिज़ाइन से ब्राउज़र/edge-सुरक्षित; केवल-Node
वॉलेट फ़ाइल I/O एक अलग `@openfiat/sdk/node` प्रवेश बिंदु में रहता है।

## स्थापना

Pre-1.0 और अभी npm पर प्रकाशित नहीं — इसे एक git निर्भरता के रूप में लें, एक
commit पर पिन:

```bash
pnpm add "github:OpenFiat-org/openfiat-sdks#<commit>&path:typescript"
```

## त्वरित प्रारंभ

```typescript
import { Client } from "@openfiat/sdk";

const client = new Client({ endpoint: "http://localhost:7080", timeoutMs: 30_000 });
const version = await client.call("getVersion", {});
```

टाइप्ड मेथड प्रति डोमेन एक मॉड्यूल में समूहित हैं — `node`, `chain`, `oracles`,
`providers`, `advertisements`, `reservations`, `notifications`:

```typescript
import { node } from "@openfiat/sdk";

const version = await node.getVersion(client);
```

## एक लेखन पर हस्ताक्षर और सबमिट करना

हर `sendX` मेथड डोमेन के अपने इवेंट ऑब्जेक्ट के साथ एक `Keypair` लेता है — SDK
हस्ताक्षरित payload बनाता और सबमिट करता है; एक नोड कभी आपकी ओर से कुछ भी संरचित या
हस्ताक्षरित नहीं करता:

```typescript
import { generateKeypair, oracles } from "@openfiat/sdk";

const keypair = await generateKeypair(); // या "@openfiat/sdk/node" से keypairFromSeed(...) / loadWalletFile(...)
const oracleId = await oracles.sendOraclePublish(client, publish, keypair);
```

## उदाहरण

[`typescript/examples`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/typescript/examples)
का हर उदाहरण एक असली नोड के विरुद्ध चलता है और `tests/live_node.test.ts` में एक
टेस्ट द्वारा कवर है, CI में एक असली `openfiat-node` प्रक्रिया के विरुद्ध चलाया गया
(`.github/workflows/ci.yml` का `typescript-sdk-live-node` जॉब देखें) — एक टूटा
उदाहरण बिल्ड को उसी तरह विफल करता है जैसे एक टूटा टेस्ट करता:

- [`basic.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/basic.ts) — एक क्लाइंट बनाएँ।
- [`oracle_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/oracle_provider.ts) — एक ऑरेकल प्रदाता के रूप में पंजीकृत करें, एक दर प्रकाशित करें।
- [`notification_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/notification_provider.ts) — एक सूचना प्रदाता के रूप में पंजीकृत करें, एक डिलीवरी रिपोर्ट करें।
- [`trading_bot.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/trading_bot.ts) — एक विज्ञापन प्रकाशित करें, उसके विरुद्ध एक आरक्षण खोलें।
- [`solana_transaction.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/solana_transaction.ts) — चेन ब्रिज के माध्यम से एक असली Solana लेनदेन हस्ताक्षरित और सबमिट करें।

इनमें से किसी को एक स्थानीय नोड के विरुद्ध चलाएँ:

```bash
# टर्मिनल 1 — openfiat-core से
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080

# टर्मिनल 2 — openfiat-sdks/typescript से
pnpm tsx examples/trading_bot.ts
```
