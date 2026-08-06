---
title: Dompet
---

# Dompet

Ada tampilan dompet di aplikasi web OpenFiat,
[openfiat-app](https://github.com/OpenFiat-org/openfiat-app) (`/wallet`), dan ia
masih merender data demo — aplikasi sedang dipindahkan ke data langsung satu rute
pada satu waktu, dan ini bukan salah satu rute yang telah berpindah.

Dompet lintas-platform mandiri (Android, iOS, Linux, macOS, Windows, Web) tetap
ditunda. Placeholder untuknya di `openfiat-apps` tak pernah dikerangkakan, dan
repositori itu tak lagi dalam pengembangan aktif.

Sampai saat itu, sebuah node tak pernah menahan atau menandatangani apa pun untuk
Anda: tiap mutasi adalah muatan yang ditandatangani keypair Anda sendiri secara
lokal dan disubmit — lihat [penamaan metode](../api) dan salah satu [SDK](../sdks)
untuk primitif penandatanganan.
