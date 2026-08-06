---
title: Penemuan peer
sidebar_position: 3
---

# Penemuan peer

Sebuah node bergabung dengan men-dial sebuah entrypoint dan menemukan sisa jaringan
sendiri. Penemuan peer (OFS-1100) menukar peer yang dikenal lewat koneksi yang sama
yang sudah dipakai gossip, jadi sebuah node belajar peer yang tak pernah diberikan
padanya dan mengumumkan alamat tempat ia terjangkau.

Ini layak dinyatakan dengan jelas karena tak selalu benar, dan kegagalannya tak
kelihatan: layanan penemuan sepenuhnya terimplementasi dan mengonvergenkan lima
node dalam tesnya sendiri, dan tak ada node yang berjalan pernah menyusun satu.
Node tak mengumumkan alamat dan tak belajar peer yang tak diberikan secara statis,
sementara tampak sepenuhnya sehat dari tiap pemeriksaan lokal. Sebuah node punya
satu swarm libp2p, hanya satu hal yang bisa menggerakkan loop peristiwa swarm itu,
dan gossip memilikinya — jadi layanan yang tak memiliki swarm tak menerima apa pun,
selamanya. Keduanya kini berbagi satu koneksi, dan pesan dirutekan ke salah satu
atau yang lain menurut nomor spec OFS milik amplop sendiri.

Penemuan bukan flag dan tak bisa dimatikan.

## Koneksi pertama

Tak ada yang bisa menemukan jaringan dari ketiadaan, jadi `--entrypoint` tetap
bagaimana sebuah node dimulai:

```bash
openfiat-node --entrypoint /dns4/openfiat.allenhark.com/udp/4001/quic-v1/p2p/12D3KooW...
```

Ulangi untuk beberapa. Nama host berfungsi dan lebih disukai — node me-resolve-nya
saat mulai lewat resolver sistem operasi sendiri, jadi klaster bertahan atas
perubahan IP entrypoint. **Pertahankan sufiks `/p2p/<peer id>`**: DNS tak
terautentikasi, dan peer id adalah yang membuat rekaman yang dibajak gagal jabat
tangan alih-alih diam-diam menjadi satu-satunya peer Anda.

Entrypoint yang takkan di-resolve menghentikan node saat mulai alih-alih dilewati.
Node yang diam-diam menjatuhkan satu akan menyala tanpa peer sama sekali dan tampak
sempurna sehat sementara tak berbicara dengan siapa pun — yang justru kegagalan
yang membuka bagian ini.

Mulai tanpa entrypoint sama sekali dan node mengatakannya, pada `WARN`. Itu benar
untuk node pertama sebuah klaster baru dan salah untuk yang lain.

## Apa yang node Anda umumkan tentang dirinya

Tiap alamat yang node tahu ia mendengarkannya, dikurangi wildcard bind. `0.0.0.0`
dan `::` adalah instruksi mendengarkan yang berarti «tiap antarmuka lokal», bukan
tujuan — dan karena `--gossip-bind-address` bawaannya tepat itu, mengumumkannya
tanpa saring justru bug yang meninggalkan peer tanpa apa pun untuk di-dial.

Rentang loopback dan privat sengaja *tidak* disaring. Proses pada satu host saling
menjangkau lewat loopback, klaster docker-compose atau LAN menjangkau peer-nya
hanya lewat alamat privat, dan klaster host-tunggal adalah deployment nyata
alih-alih artefak uji.

### Di balik NAT, dalam kontainer, atau di host cloud dengan IP terpetakan

Alamat yang di-bind node Anda bukan alamat tempat peer bisa menjangkaunya, dan node
tak bisa menyimpulkan yang publik. Itu bukan kelalaian — secara konstruksi, hanya
sesuatu di sisi seberang NAT yang bisa mengamati alamat publik. Jadi operator
mendeklarasikannya:

```bash
--external-addr /ip4/203.0.113.7/udp/4001/quic-v1
```

Dapat diulang. Alamat yang dideklarasikan diumumkan **sebelum** yang di-bind, jadi
peer yang mencobanya berurutan terhubung pada percobaan pertama alih-alih habis
waktu di `172.17.0.2`. Alamat yang di-bind tetap diumumkan juga — menjatuhkannya
akan memperbaiki kasus jauh dengan merusak yang lokal.

Hilangkan flag jika node Anda memang di antarmuka publik. Alamat yang di-bind-nya
sudah yang publiknya.

## Bertanya pada node apa yang diketahuinya

```bash
curl -s -X POST http://localhost:7080/rpc -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getPeers","params":{}}' | jq
```

```json
{
  "self_peer_id": "12D3KooWK9hQ7TwbfvFiaAxUbRFCkdhS7iEpAJDnewNL1anyREQ1",
  "announced_addresses": ["/ip4/203.0.113.7/udp/4001/quic-v1"],
  "peers": [
    {
      "peer_id": "12D3KooW...",
      "addresses": ["/ip4/198.51.100.4/udp/4001/quic-v1"],
      "node_version": "openfiat/0.1.0",
      "supported_ofs": [1000, 1100, 1200, 1300, 1400, 1500, 2000, 2100, 2200, 2300, 2400, 3000, 4000, 4300, 6000, 7000, 8200],
      "roles": ["MerchantGateway", "OracleProvider", "NotificationGateway", "RiskIntelligenceProvider"],
      "last_seen": 1753800000000,
      "latency_ms": 42,
      "successes": 17,
      "failures": 0
    }
  ]
}
```

Tiga hal layak diketahui tentang respons itu.

`self_peer_id` adalah bentuk `12D3Koo…` yang masuk ke entrypoint yang Anda terbitkan
ke operator lain. Node yang tak bisa menyatakan peer id-nya sendiri tak bisa
digabungi, dan menyusunnya dari baris log adalah bagaimana ia salah ketik.

`announced_addresses` adalah yang Anda katakan pada peer untuk di-dial, dalam
urutan yang akan mereka coba. «Node saya tak mengumumkan apa pun» tak kelihatan dari
luar selama itu benar, dan operator yang memeriksa apakah `--external-addr`-nya
berlaku tak punya tempat lain untuk melihat.

`successes` dan `failures` adalah hitungan **milik node ini sendiri** atas
pertukaran dengan peer itu. Sengaja tak ada persentase uptime dan tak ada skor
kesehatan: melipat dua hitungan menjadi satu angka akan menyajikan pengalaman lokal
satu node sebagai vonis seluruh jaringan, dan dua node jujur bisa berbeda pendapat
tentang keduanya.
