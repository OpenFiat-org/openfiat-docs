---
title: Tutorial
---

# Tutorial

Tiap panduan di bawah adalah contoh [SDK](../sdks) nyata yang dapat dijalankan —
diuji di CI terhadap node langsung, bukan sekadar prosa. Mulai sebuah node lokal
dulu:

```bash
git clone git@github.com:OpenFiat-org/openfiat-core.git
cd openfiat-core
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

- **[Bangun bot trading](trading-bot)** — terbitkan iklan, buka pemesanan
  terhadapnya.
- **[Daftarkan penyedia notifikasi](notification-provider)** — daftar ke
  Registri Layanan, laporkan sebuah pengiriman.
- **[Daftarkan penyedia oracle](oracle-provider)** — daftar ke Registri
  Layanan, terbitkan kurs yang ditandatangani.
