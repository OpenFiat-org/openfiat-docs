---
title: TypeScript
---

# SDK de TypeScript

`@openfiat/sdk` ([`openfiat-sdks/typescript`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/typescript)) —
um cliente tipado para a [superfície JSON-RPC](../api) de um nó, mais assinatura
de carteira Ed25519 (via `@noble/ed25519`, interoperável com o `ed25519-dalek` do
SDK de Rust — a mesma seed de carteira produz as mesmas chaves e assinaturas em
qualquer das linguagens) e suporte à ponte de cadeia da Solana. Seguro para
navegador/edge por design; a E/S de arquivo de carteira apenas para Node vive em
um ponto de entrada separado `@openfiat/sdk/node`.

## Instalação

Pré-1.0 e ainda não publicado no npm — dependa dele como uma dependência git,
fixada a um commit:

```bash
pnpm add "github:OpenFiat-org/openfiat-sdks#<commit>&path:typescript"
```

## Início rápido

```typescript
import { Client } from "@openfiat/sdk";

const client = new Client({ endpoint: "http://localhost:7080", timeoutMs: 30_000 });
const version = await client.call("getVersion", {});
```

Os métodos tipados são agrupados um módulo por domínio — `node`, `chain`,
`oracles`, `providers`, `advertisements`, `reservations`, `notifications`:

```typescript
import { node } from "@openfiat/sdk";

const version = await node.getVersion(client);
```

## Assinar e submeter uma escrita

Cada método `sendX` recebe o próprio objeto de evento do domínio mais um
`Keypair` — o SDK constrói a carga assinada e a submete; um nó nunca constrói nem
assina nada em seu nome:

```typescript
import { generateKeypair, oracles } from "@openfiat/sdk";

const keypair = await generateKeypair(); // ou keypairFromSeed(...) / loadWalletFile(...) de "@openfiat/sdk/node"
const oracleId = await oracles.sendOraclePublish(client, publish, keypair);
```

## Exemplos

Cada exemplo em [`typescript/examples`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/typescript/examples)
roda contra um nó real e é coberto por um teste em `tests/live_node.test.ts`,
executado no CI contra um processo `openfiat-node` real (veja o job
`typescript-sdk-live-node` de `.github/workflows/ci.yml`) — um exemplo quebrado
quebra o build do mesmo modo que um teste quebrado:

- [`basic.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/basic.ts) — construa um cliente.
- [`oracle_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/oracle_provider.ts) — registre-se como Provedor de Oráculo, publique uma taxa.
- [`notification_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/notification_provider.ts) — registre-se como Provedor de Notificações, reporte uma entrega.
- [`trading_bot.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/trading_bot.ts) — publique um anúncio, abra uma reserva contra ele.
- [`solana_transaction.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/solana_transaction.ts) — assine e submeta uma transação real da Solana pela ponte de cadeia.

Execute qualquer um deles contra um nó local:

```bash
# terminal 1 — a partir de openfiat-core
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080

# terminal 2 — a partir de openfiat-sdks/typescript
pnpm tsx examples/trading_bot.ts
```
