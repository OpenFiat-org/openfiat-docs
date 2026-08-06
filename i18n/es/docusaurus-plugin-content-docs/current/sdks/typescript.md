---
title: TypeScript
---

# SDK de TypeScript

`@openfiat/sdk` ([`openfiat-sdks/typescript`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/typescript)) —
un cliente tipado para la [superficie JSON-RPC](../api) de un nodo, más firma de
cartera Ed25519 (vía `@noble/ed25519`, interoperable con el
`ed25519-dalek` del SDK de Rust — la misma semilla de cartera produce las mismas claves y
firmas en cualquiera de los dos lenguajes) y soporte del puente de cadena de Solana.
Seguro para navegador/edge por diseño; la E/S de archivos de cartera solo para Node vive en un
punto de entrada `@openfiat/sdk/node` aparte.

## Instalación

Pre-1.0 y aún no publicado en npm — dependa de él como una dependencia git,
fijada a un commit:

```bash
pnpm add "github:OpenFiat-org/openfiat-sdks#<commit>&path:typescript"
```

## Inicio rápido

```typescript
import { Client } from "@openfiat/sdk";

const client = new Client({ endpoint: "http://localhost:7080", timeoutMs: 30_000 });
const version = await client.call("getVersion", {});
```

Los métodos tipados se agrupan en un módulo por dominio — `node`, `chain`,
`oracles`, `providers`, `advertisements`, `reservations`, `notifications`:

```typescript
import { node } from "@openfiat/sdk";

const version = await node.getVersion(client);
```

## Firmar y enviar una escritura

Cada método `sendX` toma el propio objeto de evento del dominio más un
`Keypair` — el SDK construye la carga firmada y la envía; un nodo
nunca construye ni firma nada en tu nombre:

```typescript
import { generateKeypair, oracles } from "@openfiat/sdk";

const keypair = await generateKeypair(); // o keypairFromSeed(...) / loadWalletFile(...) desde "@openfiat/sdk/node"
const oracleId = await oracles.sendOraclePublish(client, publish, keypair);
```

## Ejemplos

Cada ejemplo en [`typescript/examples`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/typescript/examples)
corre contra un nodo real y está cubierto por un test en
`tests/live_node.test.ts`, ejecutado en CI contra un proceso `openfiat-node`
real (consulta el job `typescript-sdk-live-node` de `.github/workflows/ci.yml`) —
un ejemplo roto rompe la build igual que lo haría un test
roto:

- [`basic.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/basic.ts) — construye un cliente.
- [`oracle_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/oracle_provider.ts) — regístrate como Proveedor de Oráculo, publica un tipo.
- [`notification_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/notification_provider.ts) — regístrate como Proveedor de Notificaciones, reporta una entrega.
- [`trading_bot.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/trading_bot.ts) — publica un anuncio, abre una reserva contra él.
- [`solana_transaction.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/solana_transaction.ts) — firma y envía una transacción real de Solana por el puente de cadena.

Ejecuta cualquiera de ellos contra un nodo local:

```bash
# terminal 1 — desde openfiat-core
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080

# terminal 2 — desde openfiat-sdks/typescript
pnpm tsx examples/trading_bot.ts
```
