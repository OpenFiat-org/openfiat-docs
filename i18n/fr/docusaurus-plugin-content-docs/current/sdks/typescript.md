---
title: TypeScript
---

# SDK TypeScript

`@openfiat/sdk` ([`openfiat-sdks/typescript`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/typescript)) —
un client typé pour la [surface JSON-RPC](../api) d’un nœud, plus la signature de
portefeuille Ed25519 (via `@noble/ed25519`, interopérable avec l’`ed25519-dalek`
du SDK Rust — la même seed de portefeuille produit les mêmes clés et signatures
dans l’une ou l’autre langue) et le support du pont de chaîne Solana. Sûr pour le
navigateur/edge par conception ; l’E/S de fichier de portefeuille propre à Node
vit dans un point d’entrée séparé `@openfiat/sdk/node`.

## Installation

Pré-1.0 et pas encore publié sur npm — dépendez-en comme d’une dépendance git,
épinglée à un commit :

```bash
pnpm add "github:OpenFiat-org/openfiat-sdks#<commit>&path:typescript"
```

## Démarrage rapide

```typescript
import { Client } from "@openfiat/sdk";

const client = new Client({ endpoint: "http://localhost:7080", timeoutMs: 30_000 });
const version = await client.call("getVersion", {});
```

Les méthodes typées sont regroupées un module par domaine — `node`, `chain`,
`oracles`, `providers`, `advertisements`, `reservations`, `notifications` :

```typescript
import { node } from "@openfiat/sdk";

const version = await node.getVersion(client);
```

## Signer et soumettre une écriture

Chaque méthode `sendX` prend le propre objet d’événement du domaine plus un
`Keypair` — le SDK construit la charge signée et la soumet ; un nœud ne construit
ni ne signe jamais rien en votre nom :

```typescript
import { generateKeypair, oracles } from "@openfiat/sdk";

const keypair = await generateKeypair(); // ou keypairFromSeed(...) / loadWalletFile(...) depuis "@openfiat/sdk/node"
const oracleId = await oracles.sendOraclePublish(client, publish, keypair);
```

## Exemples

Chaque exemple dans [`typescript/examples`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/typescript/examples)
tourne contre un nœud réel et est couvert par un test dans
`tests/live_node.test.ts`, exécuté dans la CI contre un vrai processus
`openfiat-node` (voir le job `typescript-sdk-live-node` de
`.github/workflows/ci.yml`) — un exemple cassé casse le build de la même façon
qu’un test cassé :

- [`basic.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/basic.ts) — construire un client.
- [`oracle_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/oracle_provider.ts) — s’enregistrer comme fournisseur d’oracle, publier un taux.
- [`notification_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/notification_provider.ts) — s’enregistrer comme fournisseur de notifications, signaler une livraison.
- [`trading_bot.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/trading_bot.ts) — publier une annonce, ouvrir une réservation contre elle.
- [`solana_transaction.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/solana_transaction.ts) — signer et soumettre une vraie transaction Solana via le pont de chaîne.

Exécutez l’un d’eux contre un nœud local :

```bash
# terminal 1 — depuis openfiat-core
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080

# terminal 2 — depuis openfiat-sdks/typescript
pnpm tsx examples/trading_bot.ts
```
