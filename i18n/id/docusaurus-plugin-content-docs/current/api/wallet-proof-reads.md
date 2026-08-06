---
title: Baca dengan bukti dompet
sidebar_position: 2
---

# Baca dengan bukti dompet

Hampir tiap baca di [permukaan JSON-RPC](./index.md) sebuah node bersifat terbuka,
karena yang dikembalikannya sudah direplikasi ke tiap node. Segelintir tidak, dan
garis di antaranya bukan «apakah ini rahasia» — tak ada di sini yang rahasia —
melainkan «apakah menjawab ini kepada orang asing merangkai sesuatu yang sengaja
dibiarkan tercerai-berai oleh protokol».

## Yang dilindungi adalah graf transaksi

Sebuah endpoint yang menjawab *dengan siapa dompet ini bertransaksi, dan seberapa
sering* menyerahkan kepada siapa pun sebuah peta hubungan dagang nyata: ke merchant
mana sebuah dompet selalu kembali, siapa pelanggan tetap merchant sibuk, dan
karenanya siapa yang layak diikuti sampai rumah. Di pasar fiat peer-to-peer itu
pertanyaan keselamatan fisik alih-alih preferensi.

Argumen itu dibuat sekali dan ditegakkan di satu metode (`getCounterparties`),
sementara graf yang sama tetap tersedia lewat `getSettlements`,
`getReservations`, dan `getDisputes` — tak satu pun mengambil parameter, dan
semuanya mengembalikan tiap rekaman di jaringan dengan kedua pihak dinamai dan
diberi kunci. Gerbangnya tak lemah; ia dikelilingi. Ia juga tiga metode alih-alih
satu: sebuah pemesanan menamai pembeli dan iklannya menamai merchant, jadi sisi
yang sama tersedia satu langkah lebih awal, termasuk untuk transaksi yang tak
pernah diselesaikan.

Maka baca publik kini [disunting](./trade-privacy.md), dan sebuah pihak membaca
rekamannya sendiri secara penuh dengan membuktikan ia memegang dompet.

## Jabat tangan

Tak ada akun di protokol ini, jadi «apakah ini benar-benar Anda?» hanya dapat
dijawab dengan meminta pemanggil menandatangani sesuatu yang tak mungkin ia
tandatangani sebelumnya.

### 1. Minta sebuah nonce

```json
{ "method": "getWalletChallenge", "params": { "wallet": "<base64 PeerId>" } }
```

```json
{ "result": { "subject": "<base64 PeerId>", "nonce": "<64 hex chars>", "expires_at": 1753800300000 } }
```

Penerbitannya sengaja terbuka. Sebuah nonce tak bernilai tanpa kunci privat yang
menandatanganinya, dan menuntut tanda tangan untuk memperoleh hal yang Anda
tandatangani akan melingkar; responsnya tak mengonfirmasi apa pun tentang dompet,
bahkan tidak bahwa ia ada. Tantangan hidup hanya di memori dan kedaluwarsa setelah
lima menit — cukup lama bagi seseorang membaca dan menyetujui prompt dompet, cukup
pendek agar nonce tak terpakai tak tergeletak begitu saja.

`getCounterpartiesChallenge` dan `getProviderEarningsChallenge` adalah penerbit
yang sama dengan nama berbeda. Satu nonce menjawab tepat satu panggilan, di
permukaan mana pun ia dibelanjakan.

### 2. Tandatangani tantangan

Byte yang ditandatangani adalah string UTF-8:

```
<domain>:<subject>:<nonce>
```

`subject` adalah peer id kanonik base64 yang dikembalikan tantangan, bukan ejaan
base64 mana pun yang kebetulan Anda kirim. `domain` tetap per metode:

| Metode | Domain |
| --- | --- |
| `getMySettlements` | `openfiat-my-settlements` |
| `getMyReservations` | `openfiat-my-reservations` |
| `getMyDisputes` | `openfiat-my-disputes` |
| `getCounterparties` | `openfiat-counterparties` |
| `getProviderEarnings` | `openfiat-earnings` |

Pemisah domain adalah alasan sebuah tanda tangan yang dikumpulkan untuk satu
permukaan bergerbang tak bisa disajikan di yang lain, meski keduanya mengidentifikasi
subjeknya dengan cara sama dan menarik nonce dari buku besar yang sama.

### 3. Panggil metode

```json
{
  "method": "getMySettlements",
  "params": {
    "wallet": "<base64 PeerId>",
    "public_key": "<base64 raw 32-byte Ed25519 public key>",
    "nonce": "<the nonce from step 1>",
    "signature": "<base64 64-byte Ed25519 signature>"
  }
}
```

`getMyReservations`, `getMyDisputes`, dan `getCounterparties` mengambil tepat empat
bidang yang sama. Kunci publik dikirim eksplisit alih-alih dipulihkan dari
`wallet`, jadi klaim identitas adalah sesuatu yang dinyatakan pemanggil dan
diperiksa node, bukan sesuatu yang disimpulkan node atas nama pemanggil — ia harus
turun tepat ke dompet yang ditanyakan.

Yang kembali tak disunting, dan hanya untuk rekaman yang dompetnya menjadi pihak.
`getMyDisputes` juga menjawab arbiter yang duduk, karena membaca seluruh kasus
adalah tugasnya.

## Detail yang penting jika Anda mengimplementasikan ini

**Penolakan, bukan penyempitan.** Pemanggil yang tak bisa membuktikan dompet
mendapat galat, tak pernah jawaban tersaring. Implementasi dengan penyaringan tampak
identik di tiap tes yang lulus tepat sampai sebuah refaktor menjatuhkan filternya;
sebuah penolakan gagal dengan lantang dan seketika.

**Urutan pemeriksaan.** Pemeriksaan penurunan kunci terjadi lebih dulu, sebelum
nonce disentuh, agar upaya gagal orang asing tak bisa membelanjakan nonce yang
pemilik aslinya sedang setengah menandatangani. Nonce lalu dikonsumsi *sebelum*
tanda tangan diverifikasi, agar menyajikan tanda tangan yang tertangkap membakar
nonce alih-alih memutar ulangnya.

**«Tak dikenal» dan «sudah dibelanjakan» adalah galat yang sama.** Membedakannya
akan mengonfirmasi bahwa pihak lain sedang di tengah jabat tangan untuk subjek itu.

**Tak ada yang baru disimpan.** Tantangan yang tertunda ada di memori dan jawaban
dilipat sesuai permintaan dari rekaman yang sudah direplikasi node. Seorang
operator node tak memperoleh rekaman siapa menanyakan apa — yang penting, karena
operator justru pihak yang untuknya ini tak boleh diam-diam membangun sebuah
dosir.
