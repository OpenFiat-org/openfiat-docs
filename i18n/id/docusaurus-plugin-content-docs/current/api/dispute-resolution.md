---
title: Bagaimana sebuah sengketa diselesaikan
---

# Bagaimana sebuah sengketa diselesaikan

Sebuah sengketa punya dua paruh, dan hanya satu di antaranya yang memutuskan apa
pun.

**Lapisan off-chain** mengumpulkan. Ia memverifikasi tanda tangan tiap arbiter,
mencocokkan sebuah reveal dengan commit arbiter itu sebelumnya, menolak reveal
dari dompet yang tak pernah berkomitmen, membuang duplikat, dan mereplikasi
hasilnya agar tiap node melihat bukti yang sama.

**Rantai** memutuskan. Ia menghitung suara yang terungkap menurut aturannya
sendiri — dibobot stake, dengan batas bawah suara terhitung, membuka ulang satu
putaran saat seri alih-alih memecahkannya — dan ia menggerakkan kustodi.

## Lapisan off-chain tidak menghitung

Dulu iya. `getDispute` mengembalikan sebuah resolusi yang diturunkan dari reveal
yang telah dilihat sebuah node, dan itu keliru dengan cara yang layak dipahami,
karena itu kekeliruan yang tampak seperti bantuan.

**Dua perhitungan atas suara yang sama adalah generator divergensi, bukan
pendapat kedua.** Rantai mengarbitrase ulang menurut aturan berbeda, jadi ia
bisa mencapai jawaban berbeda tentang sengketa yang sama — dan ketika itu
terjadi, antarmuka menampilkan satu hasil sementara uang mengikuti yang lain.
Rantai adalah otoritas atas kustodi, jadi jawaban off-chain bukan pendapat
kedua: ia sebuah pernyataan yang dibuat protokol lalu dikontradiksinya dengan
dananya sendiri.

Maka `resolution` ditetapkan oleh tepat satu hal: sebuah transaksi eksekusi yang
telah diamati node ini terkonfirmasi secara independen, yang hasilnya kemudian ia
baca dari akun kasus di rantai.

## `AwaitingChainExecution` adalah jawaban nyata

Ketika tiap reveal yang diwajibkan telah masuk, kasus berada di
`AwaitingChainExecution`. Keadaan itu menyatakan lapisan off-chain telah selesai
bekerja dan kustodi belum bergerak. Ia bukan «terselesaikan menunggu eksekusi» —
frasa itu akan mengklaim hasil yang node tak berhak menamainya.

Sebuah node yang melihat transaksi mendarat tapi tak bisa membaca apa yang
diputuskannya **tetap** di `AwaitingChainExecution` dan mencatat tanda tangan
yang diamatinya. Sesuatu terjadi di rantai dan node ini belum tahu apa;
mengatakannya adalah jawaban jujur, dan mengarang vonis untuk mengisi celah
adalah tepat kegagalan yang dihapus aturan ini.

## Kesepakatan para pihak bukan pengecualian

Kedua pihak dapat menyepakati penyelesaian mutual, dan lapisan off-chain
memverifikasi kedua tanda tangan secara langsung. Ia mencatat kesepakatan itu
begitu memilikinya — itu fakta nyata tentang kasus, dan menahannya akan
menyembunyikan dari para pihak keputusan mereka sendiri.

Tapi mencatat kesepakatan bukan mencatat resolusi. Sampai kustodi benar-benar
bergerak, kasus berada di `AwaitingChainExecution` seperti yang lain.

Yang satu ini mudah salah, karena tak seperti sebuah putusan tak ada perhitungan
yang dua node bisa lakukan berbeda — kesepakatan sekadar *adalah* dua tanda
tangan itu. Ia tetap harus menunggu, karena dua alasan:

- **Tanda tangan tak menggerakkan uang.** Sebuah kasus yang ditandai
  `MutualSettlement` sementara dana masih terkunci memberi tahu kedua pihak
  sengketa telah usai dan terbayar padahal tak satu pun benar.
- **Rantai mengeksekusi menurut tenggatnya sendiri.** Ia tetap bebas
  mengeksekusi hasil arbitrase atas sebuah kasus yang para pihaknya sepakat
  secara privat dan tak pernah menyampaikannya — menempatkan kedua lapisan
  kembali dalam kontradiksi tentang satu sengketa, yang justru untuk itulah
  seluruh aturan ini ada demi mencegahnya.

## Apa yang harus ditampilkan sebuah klien

| Node berkata | Tampilkan |
| --- | --- |
| `resolution: null`, status `AwaitingChainExecution` | Kasus diputuskan atau disepakati; kustodi belum bergerak |
| `resolution` ditetapkan, dengan tanda tangan eksekusi | Hasil, dan transaksi asalnya |
| Reveal terkumpul, tanpa perubahan status | Pengumpulan bukti; tak ada hasil untuk ditampilkan |

Jangan turunkan sebuah hasil dari reveal dalam respons `getDispute`. Reveal ada
di sana agar siapa pun dapat mengaudit apa yang diberikan ke rantai, bukan agar
sebuah klien mencapai vonisnya sendiri — sebuah klien yang menghitungnya telah
memasukkan kembali tepat divergensi yang berhenti diproduksi node.

Lihat OFS-2400 §16.2 dan §17 untuk pernyataan normatifnya.
