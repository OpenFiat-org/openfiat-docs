---
title: Merchant
---

# Merchant

Merchant menerbitkan iklan, mengelola pemesanan dan penyelesaian, serta memantau
analitik lewat aplikasi web OpenFiat,
[openfiat-app](https://github.com/OpenFiat-org/openfiat-app) — profil merchant,
wizard pasca-iklan, dan ruang transaksi hidup di sana.

Aplikasi itu sedang dialihkan dari data demo yang disimulasikan ke data langsung
satu rute pada satu waktu, dan alur merchant termasuk rute yang masih merender data
demo. Perlakukan yang Anda lihat di sana sebagai bentuk yang dimaksudkan alih-alih
buku Anda sendiri. Permukaan sisi-node di bawahnya —
`sendAdvertisementCreate`, `sendAdvertisementPriceUpdate`,
`sendAdvertisementDisable`, dan metode pemesanan serta penyelesaian — nyata hari ini
dan terdokumentasi di [referensi API](../api).

Kerangka `openfiat-apps/merchant` yang lebih lama tak lagi dalam pengembangan
aktif; pekerjaan frontend baru terpusat di `openfiat-app`.

Bagian ini akan mencakup orientasi, praktik terbaik iklan, penanganan sengketa,
dan rekonsiliasi penyelesaian seiring alur-alur itu berpindah ke data langsung.
