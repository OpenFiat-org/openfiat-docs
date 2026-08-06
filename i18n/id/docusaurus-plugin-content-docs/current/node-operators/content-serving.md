---
title: Penyajian konten
sidebar_position: 2
---

# Penyajian konten

Sebuah rekaman protokol tak pernah membawa berkas. Ia membawa CID — hash
swadeskripsi dari konten yang disimpan di tempat lain — yang menjaga kuitansi 10 MB
tetap di luar muatan gossip yang harus disimpan dan diputar ulang tiap node,
sekaligus tetap membiarkan seorang arbiter menetapkan bahwa gambar yang dilihatnya
adalah yang ditandatangani pihak.

Seseorang tetap harus menahan byte-nya. Seseorang itu adalah node Anda, dan **ia
sudah melakukannya**: penyajian konten aktif secara bawaan dan tak butuh
konfigurasi.

## Mengapa ini di node dan bukan sebuah daemon

Versi pertama ini melakukan pin lewat daemon [Kubo](https://github.com/ipfs/kubo)
terpisah, dijangkau lewat `--ipfs-api-url`. Itu berhasil, dan berbiaya lebih dari
tampaknya: identitas peer kedua di jaringan, sebuah runtime Go dan memori
residennya di samping milik node, dan permukaan kontrol `/api/v0` tak terautentikasi
di port 5001 yang membiarkan siapa pun yang menjangkaunya mem-pin, meng-unpin, dan
membaca segalanya yang ditahan daemon — hanya diredam dengan mengikatnya ke
loopback.

Masalah yang lebih dalam adalah bawaannya. Menjalankan daemon adalah pekerjaan,
jadi pin bersifat opt-in, jadi hampir tak ada yang akan mengaktifkannya — dan
jaminan ketahanan yang tak dimasuki siapa pun bukan jaminan. Sebuah node kini
berbicara bitswap dalam proses, di atas identitas libp2p yang sama yang sudah
dipakainya ber-gossip, yang memungkinkan perilaku aktif secara bawaan. Itu pada
gilirannya yang membuat premi imbalan mengukur sesuatu yang nyata: dengan semua
menyajikan, pengali memisahkan node yang benar-benar menahan dan menjawab untuk
konten dari node yang luring atau telah memangkas, alih-alih memisahkan operator
yang repot memasang Go dari yang tidak.

## Apa yang ditahan node Anda, dan apa yang tidak

Ia menahan konten yang dirujuk rekaman lampiran yang telah **diterimanya**, dalam
jendela retensinya. Ia tak mengambil tiap CID yang dilihatnya — node yang
melakukannya akan menyimpan apa pun yang dipilih siapa pun untuk diarahkan padanya.

Batas itu bukan janji, ia aritmetika: sebuah lampiran harus menamai sebuah
penyelesaian, dan sebuah penyelesaian butuh pemesanan nyata terhadap escrow nyata.
Plafon dari apa yang diminta pada disk Anda adalah volume transaksi jaringan yang
sesungguhnya, bukan kesabaran orang asing.

Segala yang diambil diperiksa terhadap CID-nya sebelum disimpan, baik ia datang
dari peer maupun dari gateway.

Tanyakan node Anda apa yang ditahannya:

```bash
curl -s -X POST http://localhost:7080/rpc -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHeldContent","params":{"cid":"bafkrei..."}}'
# {"jsonrpc":"2.0","id":1,"result":{"content":"<base64>"}}   ← ditahan
# {"jsonrpc":"2.0","id":1,"result":{"content":null}}          ← tak ditahan
```

## Dari mana salinan pertama datang

Bitswap memindahkan blok antar peer yang sudah memilikinya; ia tak menciptakan yang
pertama. Konten masuk ke jaringan lewat layanan pinning mana pun yang antarmuka
mengunggahnya, jadi node pertama yang menginginkan sebuah CID harus mengambilnya
dari jaringan IPFS yang lebih luas, memeriksa byte terhadap CID, dan menyajikannya
ke peer-nya sejak itu.

```bash
--content-gateway https://ipfs.example.com   # bawaan: https://ipfs.filebase.io
```

Gateway adalah **transport tak tepercaya**, bukan otoritas. Ia bisa menyajikan byte
yang salah, tak ada byte, atau mencatat siapa meminta apa; ia tak bisa mengubah
konten mana yang dinamai sebuah CID, karena CID adalah hash konten itu. Byte yang
bukan yang dinamai CID ditolak, dan gateway yang menggantikan apa pun tak terbedakan
dari yang sekadar mati.

Privasi adalah satu hal yang tak diperbaiki verifikasi: siapa pun yang menjalankan
gateway belajar bahwa node Anda meminta CID ini. Itulah mengapa flag ini ada —
arahkan ke milik Anda sendiri — dan mengapa ia cadangan alih-alih pilihan pertama.
Node Anda lebih menyukai peer-nya.

## Jika Anda sudah menjalankan Kubo

`--ipfs-api-url http://127.0.0.1:5001` masih berfungsi dan kini berarti sesuatu yang
lebih sempit dari dulu: konten protokol di-pin ke daemon Anda **juga**, menaruh
salinan di suatu tempat yang tak diatur jendela retensi node Anda sendiri. Ia tak
lagi cara sebuah node menyajikan konten.

## Mematikannya, dan apa biayanya

```bash
openfiat-node --no-content-serving
```

Node itu tak menyimpan apa pun dan tak bisa menjawab tantangan keterambilan, jadi
memperoleh porsi yang dikurangi. Itu hasil yang jujur — ia berbuat lebih sedikit
untuk jaringan — dan itu flag yang tepat bila disk memang tak ada. Node tetap
menantang peer-nya bagaimanapun juga: mengukur siapa menyajikan konten adalah
layanan yang dilakukan sebuah node entah ia menyimpan sesuatu sendiri atau tidak.

### Bagaimana tantangan bekerja

Sebuah node memilih CID yang diketahui jaringan, meminta node lain untuk byte-nya,
dan meng-hash yang kembali. Alamat konten *adalah* hash kontennya, jadi
mengembalikan byte yang benar bukan sesuatu yang bisa dilakukan sebuah node tanpa
memilikinya. Ini satu-satunya sinyal kualitas node yang diperiksa alih-alih
dipercaya.

Hanya sebagian CID yang bisa memutuskan pertanyaan itu. Digest CID codec raw
diambil dari berkas itu sendiri; sebuah CID dag-pb mengalamati akar sebuah DAG yang
dipotong, jadi seorang peer bisa mengembalikan berkas yang benar dan tetap gagal
pemeriksaan hash naif. Penyedia beralih antara keduanya pada 262.144 byte, jadi
tantangan mengambil sampel berkas pada atau di bawah 256 KiB — avatar hampir selalu,
lampiran kadang. Itu cukup untuk memisahkan node yang mem-pin segalanya dari yang
tak mem-pin apa pun, yang dibutuhkan pengali; ia bukan bukti bahwa sebuah node
menahan satu lampiran besar tertentu, dan tak ada yang mengklaimnya begitu.

### Apa itu pengali

Node yang menjawab menyimpan porsi penuhnya; node yang tak bisa diskalakan ke
**0.7**, jadi node yang menyajikan memperoleh sekitar 1.43× yang diperoleh node
yang selain itu identik yang tak menyajikan. Kedua angka `[PROPOSED — NEEDS SIGN-OFF]`
— lihat OFS-4100 §9.2 dan `crates/rewards/src/params.rs`.

Premi dinyatakan sebagai penalti karena alasan yang bukan presentasional. Emisi per
epoch tetap, dan pengali ini memutuskan bagaimana ia *dibagi*. Bonus di atas 1.0
takkan membayar node yang mem-pin dari ketiadaan, ia akan mencetak emisi yang tak
dimuat ember Infrastruktur — yang ditolak parameter imbalan mentah-mentah. Jadi
node yang mem-pin menyimpan porsi penuhnya dan node yang tak mem-pin merelakan
sebagian miliknya.

0.7 alih-alih 0.4 milik gossip-saja karena penyimpanan adalah budi yang lebih kecil
bagi jaringan daripada koneksi rantai: node yang tak mem-pin tetap merelai,
memvalidasi, dan menyajikan segala yang lain.

## Berapa lama konten disimpan

Tak tiap node harus mengangkut seluruh riwayat.

```bash
--retention 30          # bawaan: jendela bergulir 30 hari
--retention 365         # jendela lebih panjang, tetap bergulir
--retention archival    # simpan segalanya, selamanya — pilihan eksplisit
```

30 hari juga batas bawah yang tiap node utang pada jaringan, jadi nilai lebih
pendek **ditolak** alih-alih dinaikkan diam-diam — node yang dikonfigurasi untuk
tujuh hari tapi diam-diam berjalan tiga puluh akan melakukan sesuatu selain yang
diminta operatornya.

Batas bawah itulah yang membiarkan pengusiran dan imbalan berdampingan. Tantangan
selalu hanya ditarik dari konten di dalamnya, jadi node bergulir yang mengusir
bukti tahun lalu dengan benar tak pernah ditanyai tentangnya dan tak pernah
kehilangan porsinya karena berbuat benar. Setara, tak ada node yang bisa memperkecil
apa yang bisa ditanyakan padanya dengan mendeklarasikan jendela lebih kecil.
