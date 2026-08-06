---
title: TypeScript
---

# TypeScript SDK

`@openfiat/sdk` ([`openfiat-sdks/typescript`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/typescript)) —
klien bertipe untuk [permukaan JSON-RPC](../api) node, plus penandatanganan dompet
Ed25519 (via `@noble/ed25519`, dapat beroperasi bersama `ed25519-dalek` milik SDK
Rust — seed dompet yang sama menghasilkan kunci dan tanda tangan yang sama di kedua
bahasa) dan dukungan jembatan rantai Solana. Aman untuk browser/edge secara desain;
I/O berkas dompet khusus Node hidup di titik masuk terpisah `@openfiat/sdk/node`.

## Pemasangan

Pra-1.0 dan belum diterbitkan ke npm — bergantunglah padanya sebagai dependensi
git, disematkan ke sebuah commit:

```bash
pnpm add "github:OpenFiat-org/openfiat-sdks#<commit>&path:typescript"
```

## Mulai cepat

```typescript
import { Client } from "@openfiat/sdk";

const client = new Client({ endpoint: "http://localhost:7080", timeoutMs: 30_000 });
const version = await client.call("getVersion", {});
```

Metode bertipe dikelompokkan satu modul per domain — `node`, `chain`, `oracles`,
`providers`, `advertisements`, `reservations`, `notifications`:

```typescript
import { node } from "@openfiat/sdk";

const version = await node.getVersion(client);
```

## Menandatangani dan menyubmit sebuah tulisan

Tiap metode `sendX` mengambil objek peristiwa domainnya sendiri plus sebuah
`Keypair` — SDK membangun muatan yang ditandatangani dan menyubmitnya; sebuah node
tak pernah menyusun atau menandatangani apa pun atas nama Anda:

```typescript
import { generateKeypair, oracles } from "@openfiat/sdk";

const keypair = await generateKeypair(); // atau keypairFromSeed(...) / loadWalletFile(...) dari "@openfiat/sdk/node"
const oracleId = await oracles.sendOraclePublish(client, publish, keypair);
```

## Contoh

Tiap contoh di [`typescript/examples`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/typescript/examples)
berjalan terhadap node nyata dan dicakup oleh tes di `tests/live_node.test.ts`,
dijalankan di CI terhadap proses `openfiat-node` sungguhan (lihat job
`typescript-sdk-live-node` di `.github/workflows/ci.yml`) — contoh yang rusak
menggagalkan build sama seperti tes yang rusak:

- [`basic.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/basic.ts) — bangun sebuah klien.
- [`oracle_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/oracle_provider.ts) — daftar sebagai penyedia oracle, terbitkan kurs.
- [`notification_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/notification_provider.ts) — daftar sebagai penyedia notifikasi, laporkan pengiriman.
- [`trading_bot.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/trading_bot.ts) — terbitkan iklan, buka pemesanan terhadapnya.
- [`solana_transaction.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/solana_transaction.ts) — tandatangani dan submit transaksi Solana nyata lewat jembatan rantai.

Jalankan salah satunya terhadap node lokal:

```bash
# terminal 1 — dari openfiat-core
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080

# terminal 2 — dari openfiat-sdks/typescript
pnpm tsx examples/trading_bot.ts
```
