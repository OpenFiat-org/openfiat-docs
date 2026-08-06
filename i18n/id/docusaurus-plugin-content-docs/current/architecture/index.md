---
title: Arsitektur
---

# Arsitektur

OpenFiat bukan sebuah blockchain — ia protokol peer-to-peer terdesentralisasi yang
dibangun di atas Solana. Solana menyediakan penyelesaian on-chain yang aman dan
transparan lewat smart contract yang telah diaudit; OpenFiat menyediakan jaringan
koordinasi peer-to-peer yang bertanggung jawab atas iklan, penemuan transaksi,
komunikasi terenkripsi, reputasi, tata kelola, dan notifikasi.

## Lapisan

- **Lapisan jaringan** — penemuan peer, gossip, sinkronisasi snapshot/sesi, registri layanan (lihat `openfiat-core/crates/{network,discovery,gossip,snapshot,sessions,registry}`).
- **Lapisan konten** — berkas yang ditunjuk rekaman protokol, dialamatkan dengan CID dan disajikan antar node lewat bitswap (`crates/content`).
- **Lapisan transaksi** — iklan, pemesanan, penyelesaian, sengketa.
- **Lapisan kepercayaan** — deklarasi identitas, reputasi, intelijen risiko.
- **Lapisan koordinasi** — tata kelola, notifikasi, oracle.

Masing-masing berjalan dalam satu proses dan, di kabel, di atas satu identitas
libp2p — tanpa daemon kedua dan tanpa peer id kedua. Penemuan dan gossip
dimultipleks di atas satu koneksi dan dirutekan terpisah menurut nomor spec OFS
yang dibawa amplopnya; penyajian konten berbicara `/ipfs/bitswap/1.2.0` standar di
swarm yang sama, yang memungkinkan peer IPFS mana pun mengambil konten protokol
langsung dari sebuah node.

Lihat [implementasi rujukan](https://github.com/OpenFiat-org/openfiat-core) untuk
rincian tingkat crate saat ini, dan
[`docs/architecture.md`](https://github.com/OpenFiat-org/openfiat-core/blob/main/docs/architecture.md)
di sana untuk graf dependensi crate, format kabel, dan transport.
