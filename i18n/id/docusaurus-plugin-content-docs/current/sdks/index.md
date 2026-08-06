---
title: SDK
---

# SDK

SDK resmi dipelihara dalam satu monorepo,
[openfiat-sdks](https://github.com/OpenFiat-org/openfiat-sdks). Keduanya nyata,
diuji terhadap node [`openfiat-core`](https://github.com/OpenFiat-org/openfiat-core)
langsung di CI (bukan sekadar pemeriksaan tipe) dan mencakup seluruh
[permukaan RPC](../api): iklan, pemesanan, penyelesaian, transaksi, sengketa,
identitas, tata kelola, penyedia layanan, notifikasi, oracle, risiko, snapshot,
sesi, dan [jembatan rantai Solana](https://github.com/OpenFiat-org/openfiat-specs/blob/main/Whitepaper/Specifications/OFS-4300%20-%20OpenFiat%20Chain%20Bridge%20Protocol%20(OCBP).md).

- **[Rust →](rust)** — `openfiat-sdk` di direktori `rust/` monorepo.
- **[TypeScript →](typescript)** — `@openfiat/sdk` di `typescript/`.

Tiap SDK berbagi bentuk yang sama: sebuah `Client`/`ClientConfig` untuk berbicara
dengan permukaan JSON-RPC node, metode bertipe `getX`/`sendX` per domain (satu
modul per domain — lihat tata letak modul milik masing-masing SDK), dan sebuah
primitif penandatanganan yang tak pernah meninggalkan proses Anda sendiri — sebuah
node hanya pernah menerima muatan yang sudah ditandatangani, tepat seperti
`sendTransaction` Solana.

## Belum siap

Python, Go, Swift, Kotlin, dan C# punya kerangka di monorepo (`python/`, `go/`,
`swift/`, `kotlin/`, `csharp/`) tapi belum ada implementasi nyata — dilacak di
`ROADMAP.md` monorepo. Gunakan Rust atau TypeScript hari ini; kontribusi yang
memperluas salah satu lainnya disambut.
