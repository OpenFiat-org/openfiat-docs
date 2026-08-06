---
title: Apa yang dikembalikan baca publik
sidebar_position: 3
---

# Apa yang dikembalikan baca publik

`getSettlement`, `getSettlements`, `getReservation`, `getReservations`,
`getDispute`, dan `getDisputes` adalah baca terbuka, tak terautentikasi, dan tak
lagi mengembalikan identitas pihak. Sebuah pihak membaca rekamannya sendiri secara
penuh lewat [metode bukti dompet](./wallet-proof-reads.md).

## Mengapa penyuntingan alih-alih autentikasi

Sebuah explorer yang menampilkan volume, keadaan, dan waktu penyelesaian adalah
pandangan publik yang sah atas jaringan publik. Menaruh tanda tangan di depannya
akan merusak itu sekaligus mendorong siapa pun yang gigih kembali ke gossip
mentah, yang tak mencapai apa-apa. Yang tak pernah dibutuhkan explorer adalah
*siapa* — jadi baca publik mempertahankan segalanya kecuali identitas.

Yang dirangkai identitas adalah graf transaksi, dan argumen menentang
menyerahkannya dibuat penuh di halaman
[baca dengan bukti dompet](./wallet-proof-reads.md): di pasar fiat peer-to-peer,
mengetahui ke merchant mana sebuah dompet selalu kembali dan siapa pelanggan tetap
merchant sibuk adalah pertanyaan keselamatan fisik alih-alih preferensi. Satu
panggilan tak terautentikasi dulu dipakai untuk membangunnya kembali.

## Sejujurnya ini bernilai berapa

Rekaman ini di-gossip ke tiap node. Siapa pun yang menjalankan satu membaca
semuanya, dan penyuntingan tak mengubah itu. Yang dilindungi adalah *kemudahan*
kueri — perbedaan antara mem-`curl` node akses publik orang lain dan mendirikan
sebuah node untuk mengindeks jaringan. Perbedaan itu adalah sebagian besar dari
apa yang menyusun pemanenan santai.

Menyatakannya dengan jelas lebih penting daripada tampaknya: seorang integrator
yang percaya rekaman ini rahasia akan membangun sesuatu yang bersandar pada jaminan
yang tak dibuat protokol.

## Bentuk-bentuknya

### Settlement

| Dipertahankan | Dihapus |
| --- | --- |
| `id`, `reservation_id`, `amount`, `state` | `buyer`, `buyer_public_key` |
| `escrow_release_signature` | `seller`, `seller_public_key` |
| `payment_submitted_at`, `merchant_responded_at` | `payment_reference` |
| `payment_discrepancy`, `created_at`, `updated_at` | |

`escrow_release_signature` tetap ada karena menamai transaksi on-chain yang sudah
dapat dibaca siapa pun di Solana, dan itulah yang membuat sebuah penyelesaian dapat
diperiksa secara independen.

`payment_reference` boleh dibilang yang lebih buruk dari dua penghapusan: ia teks
bebas tempat pembeli menaruh referensi banknya sendiri, jadi rutin membawa nama
asli atau nomor rekening.

### Reservation

| Dipertahankan | Dihapus |
| --- | --- |
| `id`, `advertisement_id`, `amount`, `state` | `requester` |
| `requested_at`, `updated_at`, `expires_at` | `requester_public_key` |

`advertisement_id` dipertahankan dengan sengaja. Sebuah iklan adalah tawaran
publik dan sudah membawa peer id merchant-nya di tiap baris buku pesanan, jadi ia
mengungkap satu ujung sebuah sisi yang tak pernah privat. Yang tak diungkapnya
adalah ujung lain — yang justru membuatnya sebuah sisi.

### Dispute

| Dipertahankan | Dihapus |
| --- | --- |
| `id`, `settlement_id`, `status`, `resolution` | `buyer`, `seller`, `opener` dan kuncinya |
| `required_arbitrators`, `arbitrators_seated` | `reason` |
| `commitments`, `reveals` (hitungan) | `arbitrators`, `arbitrator_keys` |
| `onchain_execution_signature` | commit dan reveal individual |
| `opened_at`, `updated_at` | bendera kesepakatan mutual |

Perhatikan bahwa di sini `commitments` dan `reveals` adalah **hitungan**, bukan
daftar — cukup bagi explorer untuk menampilkan kasus yang bergerak maju, tanpa
suara siapa pun tertaut ke namanya.

Tiga alasan terpisah untuk yang dibuang. Para pihak, karena sengketa adalah kasus
di mana mengetahui siapa berselisih dengan siapa paling jelas layak
disalahgunakan. `reason`, karena ia teks bebas tentang perselisihan nyata atas
uang nyata dan menamai orang, bank, dan referensi sebagai hal biasa. Daftar
arbiter, karena arbiter adalah penyedia terdaftar yang identitasnya bukan rahasia
tersendiri — tapi *arbiter mana menarik kasus mana, dan bagaimana ia memilih*
justru pasangan yang membuat menekan salah satunya sepadan. Bendera kesepakatan
mutual pergi bersamanya: «penjual telah setuju dan pembeli belum» adalah posisi
negosiasi, dan menerbitkannya ke penonton mengubah negosiasi antara dua orang.

## Jika Anda menambahkan sebuah bidang

Sebuah bidang punya tempat dalam pandangan publik hanya jika ia mengatakan sesuatu
tentang *transaksi* alih-alih tentang *orang*. Saat ragu ia tetap di luar:
menambahkan satu belakangan adalah catatan rilis, dan menghapus satu adalah
pengungkapan yang sudah terjadi.
