---
title: FAQ
---

# FAQ

**Apakah OpenFiat sebuah blockchain?**
Bukan. OpenFiat adalah protokol koordinasi peer-to-peer yang dibangun di atas
Solana, yang menangani penyelesaian.

**Apakah node saya butuh daemon IPFS terpisah?**
Tidak. Sebuah node menyajikan konten protokol sendiri, di atas identitas libp2p-nya
sendiri, dan ini aktif secara bawaan — `--ipfs-api-url` dan daemon Kubo bukan lagi
cara kerjanya. Lihat [penyajian konten](../node-operators/content-serving).

**Haruskah saya mendaftar tiap peer yang harus diajak bicara node saya?**
Tidak. `--entrypoint` membuat koneksi pertama; setelah itu sebuah node belajar peer
yang tak pernah diberikan padanya dan mengumumkan alamat tempat ia terjangkau.
Lihat [penemuan peer](../node-operators/peer-discovery).

**Siapa yang menjalankan OpenFiat?**
AllenHark memimpin pengembangan awal dan mendanai pertumbuhan awal, dengan tujuan
jangka panjang eksplisit berupa desentralisasi progresif — lihat
[Pengantar](../whitepaper) dan Bab 24 (Tata Kelola & Evolusi Protokol).

**Di bawah lisensi apa kodenya?**
Apache License 2.0, di tiap repositori di
[OpenFiat-org](https://github.com/OpenFiat-org).

**Ke mana saya melaporkan masalah keamanan?**
Lihat `SECURITY.md` di repositori terkait — jangan membuka isu publik.
