---
title: API
sidebar_position: 1
---

# API

Setiap node OpenFiat mengekspos satu endpoint JSON-RPC 2.0 yang dimodelkan
langsung dari API JSON-RPC milik Solana sendiri — nama metode camelCase
`getX`/`sendX` di atas satu endpoint POST, alih-alih hierarki sumber daya REST.
Ia diimplementasikan oleh crate `rpc` dan `api` di
[`openfiat-core`](https://github.com/OpenFiat-org/openfiat-core).

## Endpoint

```
POST /rpc
Content-Type: application/json
```

Setiap permintaan adalah amplop JSON-RPC 2.0 standar:

```json
{ "jsonrpc": "2.0", "id": 1, "method": "getAdvertisement", "params": { "id": "ad-1" } }
```

dan setiap respons adalah `result` atau `error`, tak pernah keduanya:

```json
{ "jsonrpc": "2.0", "id": 1, "result": { "id": "ad-1", "status": "Active", "..." : "..." } }
```

Node devnet publik ada di `https://openfiat.allenhark.com` — host yang sama juga
menerbitkan multiaddr entrypoint untuk *node*, yang merupakan alamat berbeda untuk
tugas berbeda (lihat
[getting started](https://github.com/OpenFiat-org/openfiat-core/blob/main/docs/getting-started.md)).
Node mana pun yang Anda jalankan sendiri menyajikan permukaan identik di `:7080`.

## Kunci, peer id, dan tanda tangan adalah base58

Setiap kunci publik, pengenal peer, tanda tangan, dan pengenal peristiwa adalah
string base58:

```json
{
  "service_id": "node-ALLENLMtV1zEAHT3xpVryqcbdPCB8c9JhM1Jdbe5XHg5",
  "provider": "12D3KooWK9hQ7TwbfvFiaAxUbRFCkdhS7iEpAJDnewNL1anyREQ1",
  "provider_public_key": "ALLENLMtV1zEAHT3xpVryqcbdPCB8c9JhM1Jdbe5XHg5"
}
```

Sampai belum lama ini ini adalah larik bilangan bulat. Jika Anda melihat
`"provider_public_key": [192, 74, 15, ...]`, Anda berbicara dengan node yang
mendahului perubahan ini — dan tak ada dalam respons itu yang membedakan kunci
publik yang diterbitkan dari kunci privat yang bocor, karena rahasia Ed25519 juga
tiga puluh dua byte. Ambiguitas itulah alasannya berubah. Bentuk base58 juga satu-
satunya yang dapat dipakai: `12D3KooW…` adalah yang diterima `--entrypoint` dan
yang dapat dicari di sebuah log.

**Ini bukan sekadar perubahan tampilan.** Sebuah muatan `sendX` ditandatangani di
atas JSON struct internalnya, jadi klien yang menulis kunci ke muatan sebagai
larik menghasilkan transkrip yang tak direproduksi node. Tanda tangan lalu gagal
verifikasi — yang muncul sebagai mutasi ditolak, bukan sebagai galat penguraian.
Gunakan sebuah [SDK](../sdks) dan ini ditangani untuk Anda; bila menyusun format
kabel dengan tangan, encode pengenal sebagai base58.

Bidang byte yang **bukan** pengenal tetap larik. `commitment` sebuah suara
sengketa dan `secret` reveal-nya adalah nilai opak tiga puluh dua byte, bukan
identitas, dan dikirim sebagai larik. Pembedaannya menurut apa bidang itu *ada*,
bukan menurut panjangnya.

## Penamaan metode

Metode baca diawali `get` dan tak pernah mengubah keadaan:

```json
{ "method": "getReservation", "params": { "id": "res-1" } }
{ "method": "getReservations", "params": {} }
```

Metode `getMyX` tetap sebuah baca, tapi ia hanya menjawab untuk dompet yang
dibuktikan dimiliki pemanggil — lihat [baca dengan bukti dompet](./wallet-proof-reads.md).

Mutasi diawali `send` dan mengambil satu bidang — `data`, muatan kabel yang
di-encode base64 dan **sudah ditandatangani** yang diproduksi dompet pemanggil
sendiri secara lokal. Ini mencerminkan `sendTransaction` Solana: node tak pernah
menyusun atau menandatangani apa pun atas nama pemanggil, ia hanya men-decode
muatan dan menerapkannya lewat jalur verifikasi tanda tangan yang sama yang
dilalui peristiwa yang diterima via gossip.

```json
{ "method": "sendReservationRequest", "params": { "data": "<base64 wire bytes>" } }
```

`Client` bertipe tiap [SDK](../sdks) membangun dan menandatangani muatan itu
untuk Anda — itu titik integrasi yang direkomendasikan alih-alih menyusun format
kabel dengan tangan.

## Kategori metode

| Domain | Contoh metode |
| --- | --- |
| Iklan | `getAdvertisement`, `getAdvertisements`, `sendAdvertisementCreate`, `sendAdvertisementPriceUpdate`, `sendAdvertisementDisable` |
| Pemesanan | `getReservation`, `getReservations`, `getMyReservations`, `sendReservationRequest` |
| Penyelesaian | `getSettlement`, `getSettlements`, `getMySettlements`, `sendSettlementInitiate`, `sendPaymentSubmitted`, `sendSettlementApproved` |
| Transaksi (join hanya-baca) | `getTrade`, `getTrades` |
| Sengketa | `getDispute`, `getDisputes`, `getMyDisputes`, `sendDisputeOpen`, `sendArbitratorJoin`, `sendVoteCommit`, `sendVoteReveal` |
| Bukti dompet | `getWalletChallenge`, `getCounterpartiesChallenge`, `getCounterparties`, `getProviderEarningsChallenge` |
| Volume | `getSettledVolume` |
| Lampiran dan konten | `getSettlementAttachments`, `getHeldContent`, `sendAttachmentPublish` |
| Identitas | `getIdentityClaim`, `getIdentityClaimsByWallet`, `sendClaimPublish` |
| Reputasi (hanya-baca) | `getReputation` |
| Tata kelola | `getProposal`, `getProposals`, `sendProposalCreate`, `sendVoteCast` |
| Penyedia layanan | `getProvider`, `getProviders`, `sendProviderRegister`, `sendProviderHealthUpdate`, `getProviderEarnings`, `sendProviderWithdraw` |
| Notifikasi | `getSubscription`, `getNotificationDispatch`, `sendSubscriptionUpdate`, `sendDeliveryReport` |
| Oracle | `getOracleRecord`, `getExchangeRate`, `getMedianExchangeRate`, `sendOraclePublish` |
| Intelijen risiko | `getWalletScreening`, `sendRiskPublish` |
| Imbalan | `getRewardObservations` |
| Snapshot | `getLatestSnapshot`, `getSnapshots`, `getCheckpointSlot`, `sendSnapshotAnnounce` |
| Sesi | `getSession`, `sendSessionEstablish`, `sendSessionRenew`, `sendSessionRevoke`, `sendSessionMigrate` |
| Jembatan rantai (Solana, OFS-4300) | `getChainStatus`, `getLatestBlockhash`, `sendTransaction` |
| Node | `getVersion`, `getHealth`, `getPeers` |

## Baca yang tak menyebut para pihak

`getSettlement(s)`, `getReservation(s)`, dan `getDispute(s)` mengembalikan rekaman
dengan identitas pihak dihapus. Itu perubahan yang disengaja, bermotif keamanan,
bukan kelalaian, dan punya halaman tersendiri:
[apa yang dikembalikan baca publik](./trade-privacy.md). Sebuah pihak membaca
rekamannya sendiri secara penuh lewat [baca dengan bukti dompet](./wallet-proof-reads.md).

## Sengketa diputuskan di rantai, bukan oleh node yang menjawab Anda

Respons `getDispute` membawa reveal yang telah dikumpulkan sebuah node, dan
**tidak** membawa hasil yang diturunkan darinya. Sebuah resolusi muncul hanya
setelah node ini mengamati transaksi eksekusi terkonfirmasi dan membaca apa yang
diputuskannya — lihat [bagaimana sebuah sengketa diselesaikan](./dispute-resolution.md).
Klien yang menghitung sendiri reveal telah memasukkan kembali tepat divergensi
yang berhenti diproduksi node.

## Dua metode kurs, dan mana yang dipakai

`getMedianExchangeRate` mengembalikan angka telanjang atau `null`, yang merupakan
bentuk tepat ketika yang Anda mau hanyalah sebuah harga atau tak ada.

`getExchangeRate` mengambil `{ base, quote }` yang sama dan malah menjawab dengan
status berlabel, karena `null` meruntuhkan dua fakta berbeda:

```json
{ "status": "current", "rate": 129.5, "expiresAt": 1753800000000 }
{ "status": "stale" }
{ "status": "noData" }
```

Pembedaannya bukan akademis. **Stale** berarti seorang penyedia memang menerbitkan
pasangan ini dan tiap rekaman telah kedaluwarsa (OFS-7000 §12: data kedaluwarsa
bukan data terkini, sebaru apa pun lapsnya) — feed kemungkinan akan kembali, jadi
menunggu masuk akal. **NoData** berarti tak seorang pun memberi harga koridor ini
dan menunggu sia-sia. Tak satu pun sebuah angka, dan pemanggil tak boleh
menampilkan keduanya sebagai angka.

Pakai `getExchangeRate` kecuali Anda punya alasan untuk tidak. `getMedianExchangeRate`
tetap ada karena klien bergantung padanya.

## Service id

Sebuah node terdaftar di bawah `node-<kunci publik base58-nya>`, dan penyedia
snapshot di bawah `snapshot-<kunci yang sama>` — awalan itulah yang memungkinkan
satu node menahan beberapa rekaman registri tanpa bertabrakan.

Id itu diturunkan alih-alih acak agar node yang me-restart memperbarui rekamannya
yang ada alih-alih meninggalkan entri mati. Menurunkannya dari *seluruh* kunci
penting: skema terdahulu memakai delapan byte pertama peer id sebagai hex, yang
tampak seperti enam belas digit identitas tapi sebenarnya dua, karena tiap peer id
Ed25519 dibuka dengan pembukaan enam-byte yang sama. Dua node bertabrakan dalam
beberapa ratus registrasi, dan yang kedua mendaftar menggeser yang pertama.

## Apa yang node ketahui tentang jaringan

`getPeers` melaporkan peer yang telah ditemukan node ini, alamat yang diumumkannya
tentang dirinya, dan `self_peer_id`-nya dalam bentuk `12D3Koo…` yang masuk ke
`--entrypoint`. Lihat [penemuan peer](../node-operators/peer-discovery.md) untuk
pandangan operator soal itu.

## Galat

Kode galat JSON-RPC 2.0 standar (`-32700` galat penguraian, `-32601` metode tak
ditemukan, `-32602` parameter tak valid, `-32603` galat internal) mencakup
kegagalan tingkat transport. Tiap kegagalan tingkat domain — likuiditas tak cukup,
peristiwa duplikat, penanda tangan tak berwenang — kembali sebagai satu galat
aplikasi `-32000`, dengan kode numerik protokol dan nama simbolik (dari
[OFS-8000](https://github.com/OpenFiat-org/openfiat-specs)) di `data`:

```json
{ "error": { "code": -32000, "message": "INSUFFICIENT_AVAILABLE_LIQUIDITY", "data": { "ofsErrorCode": 4004, "ofsErrorName": "INSUFFICIENT_AVAILABLE_LIQUIDITY" } } }
```

## Langganan

```
GET /ws
```

menyiarkan tiap mutasi berhasil saat terjadi — `{"method": "sendX", "result": ...}` — agar klien dapat bereaksi terhadap aktivitas pasar tanpa polling. Saring di sisi klien untuk metode yang Anda pedulikan.

## Snapshot ditandai dengan slot, bukan ketinggian

`getCheckpointSlot` mengembalikan slot Solana yang keadaan snapshot terakhir yang
diimpor terkini terhadapnya, atau `null` pada node yang belum mengimpor apa pun.

Dulu `getCheckpointHeight`, dan penggantian nama ini bukan kosmetik. Nilai lama
adalah *hitungan peristiwa gossip milik node produsen sendiri*, yang per-produsen:
dua node dengan keadaan identik melaporkan angka berbeda, dan node yang bergabung
pekan lalu melaporkan yang lebih rendah daripada node yang berjalan sejak genesis.
Membandingkan angka dua produsen tak membandingkan apa pun.

Slot adalah satu-satunya jam yang sudah dibagikan tiap peserta. Ia juga membuat
sebuah klaim **dapat diperiksa** — sebuah node dapat membandingkan slot yang
diumumkan dengan pandangannya sendiri atas rantai dan menolak satu dari masa depan
yang tak masuk akal, yang mustahil terhadap angka yang hanya bisa dilihat pengumum.

**Apa yang diklaim sebuah slot lebih sempit daripada tampaknya.** Ia mengatakan
*kapan* keadaan ditangkap, bukan *apa* isinya: dua node yang membuat snapshot pada
slot yang sama bisa menahan keadaan gossip yang sedikit berbeda, karena penyebaran
tak seketika. Perlakukan ia sebagai jangkar kebaruan, bukan bukti bahwa sebuah
snapshot memuat yang lain — hal yang sama yang dimaksud snapshot Solana sendiri
dengannya.

Node yang tak pernah mengamati sebuah slot tak memproduksi snapshot dan
mengatakannya. Itu bukan syarat menjalankan koneksi RPC: node gossip-saja belajar
slot lewat jembatan rantai.

## Volume terselesaikan, dan mengapa per aset

`getSettledVolume` menjawab dengan satu baris per aset, tak pernah total:

```json
{
  "assets": [
    { "asset_mint": "2bHPi…RRU", "asset_symbol": "USDC", "decimals": 6,
      "base_units": 4500000, "settlements": 12 },
    { "asset_mint": "So111…112", "asset_symbol": "wSOL", "decimals": 9,
      "base_units": 2000000000, "settlements": 3 }
  ],
  "unattributed_settlements": 1,
  "settlements_known": 16,
  "scope": "settlements this node has replicated and observed confirmed"
}
```

Empat hal yang tak boleh dilakukan klien dengan ini:

**Jangan menjumlahkan lintas aset.** Ini token berbeda pada skala berbeda; sebuah
angka gabungan menambahkan SOL ke USDC dan tak berarti apa-apa.

**Jangan menebak `decimals`.** Ia `null`, di samping `asset_symbol` `null`, ketika
node ini tak punya nama untuk mint itu. Tampilkan alamat dan base units mentah.
Mengasumsikan `6` justru bagaimana wSOL — yang punya sembilan — keluar seribu kali
terlalu besar.

**Jangan menyembunyikan `unattributed_settlements`.** Itu penyelesaian
terkonfirmasi nyata yang iklannya sejak itu dihapus, jadi asetnya tak dapat
dipulihkan. Menghilangkannya membuat total tampak lengkap padahal kurang sebanyak
itu.

**Jangan membuang `scope`.** Ia mengatakan ini adalah penyelesaian yang direplikasi
dan dikonfirmasi *node ini* — bukan seluruh riwayat jaringan. Sebuah angka volume
yang disajikan tanpa cakupannya terbaca sebagai total global. `settlements_known`
di samping baris terhitung membuat sisanya terbaca sebagai transaksi berjalan,
bukan sebagai ketidaksesuaian.

## Referensi interaktif

**[Jelajahi tiap metode →](pathname:///api/reference.html)**

Sebuah dokumen [OpenRPC](https://open-rpc.org) 1.2.6 (padanan JSON-RPC dari spec
OpenAPI/Swagger) — [`/api/openrpc.json`](pathname:///api/openrpc.json) — plus
sebuah halaman interaktif mandiri untuk menjelajahi tiap metode. *Daftar* metode
dihasilkan langsung dari tabel dispatch langsung milik `openfiat-rpc`
(`cargo run -p openfiat-api --example dump_openrpc`), jadi ia tak bisa melenceng ke
metode yang tak dijalankan node nyata; ia diterbitkan di sini sebagai snapshot
statis karena situs dokumentasi ini tak punya node sendiri untuk menyajikannya
langsung. Arahkan panel «Try it» halaman referensi ke node yang Anda jalankan
sendiri (bawaan `http://localhost:7080`) untuk memanggil sebuah metode sungguhan.

**Skema** per metode dalam dokumen itu adalah aproksimasi yang sengaja
disederhanakan dan berbasis konvensi — tiap `getX(id)` mengambil `{id}`, tiap
`sendX` mengambil `{data}` — alih-alih JSON Schema yang diturunkan dari tipe Rust
konkret tiap metode. Di mana sebuah metode menyimpang dari konvensi itu, situs ini
adalah bentuk yang berwenang: [baca dengan bukti dompet](./wallet-proof-reads.md),
`getExchangeRate`, dan `getPeers` semuanya mengambil parameter yang tak dijelaskan
konvensi.

Node yang berjalan juga menyajikan referensi identik secara langsung dan seasal
dengan `/rpc`-nya sendiri: `GET /openrpc.json` dan `GET /docs`. `GET /metrics`
mengekspos penghitung permintaan format Prometheus untuk operator.
