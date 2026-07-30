---
title: Node Operators
sidebar_position: 1
---

# Node Operators

Node operators are the backbone of the OpenFiat network — they run the
reference [`openfiat-node`](https://github.com/OpenFiat-org/openfiat-core)
binary and participate in peer discovery, gossip, content serving, and the
service registry.

## What a node does with no configuration at all

`openfiat-node` is configured entirely by command-line flags — there is no
environment-variable fallback and no config file, deliberately, so that
`systemctl cat openfiat-node` shows exactly what a running node was given
instead of sending you on an archaeology exercise across shell profiles and
unit files. `openfiat-node --help` is the whole surface.

Run it with nothing set and it already:

- generates or loads its identity (a Solana CLI-format `wallet.json`) and uses
  that one key as both its Solana signing key and its libp2p peer id;
- serves JSON-RPC, WebSocket and REST on `0.0.0.0:7080`;
- listens for peers on `/ip4/0.0.0.0/udp/4001/quic-v1`, announces the addresses
  it is reachable at, and learns peers it was never handed — see
  [Peer discovery](./peer-discovery);
- holds the content protocol records reference and serves it over bitswap on
  its own libp2p identity — see [Content serving](./content-serving);
- keeps that content for a rolling 30 days (`--retention`), so running a node
  is a bounded storage commitment rather than an open-ended one.

Two things it does *not* do unasked: talk to Solana (`--solana-rpc-url` moves
it from `GossipOnly` to `RpcConnected`) and produce snapshots for others
(`--snapshot-public-url`). Both are opt-in because both make a claim to the
rest of the network that only the operator can vouch for.

## What is optional, and what it costs

| To disable | Do this | What you give up |
| --- | --- | --- |
| Solana connectivity | omit `--solana-rpc-url` | The node stays `GossipOnly`: on-chain answers come second-hand over gossip and can lag. It still serves the marketplace and relays transactions to an RPC-connected peer, and earns the reduced connectivity share. |
| Content serving | `--no-content-serving` | The node stores no attachment content and cannot answer a retrievability challenge, so it earns the reduced share. It still challenges its peers. |
| Producing snapshots | omit `--snapshot-public-url` | Nobody can bootstrap from this node. *Consuming* snapshots needs no configuration. |
| Peer discovery | not possible | It is not a flag. A node that announced no address and learned no peer would look healthy to every local check while talking to nobody. |

## Going further

- **The full operator walkthrough** — [`docs/getting-started.md`](https://github.com/OpenFiat-org/openfiat-core/blob/main/docs/getting-started.md)
  in `openfiat-core`: building, every flag with its real default, the public
  devnet entrypoint, putting TLS and nginx in front of the node, and the
  on-chain program ids.
- **Deployment** — [openfiat-infra](https://github.com/OpenFiat-org/openfiat-infra)
  for Docker images, the Kubernetes Helm chart, and Terraform modules;
  `packaging/systemd` and `packaging/windows` in `openfiat-core` for running
  the binary directly as a service.
- **Local test networks** — [openfiat-devtools](https://github.com/OpenFiat-org/openfiat-devtools)
  (`testnet/`, `devnet/`).
- **Reputation and stake-weighted QoS** — OFS-1600 in
  [Protocol Specs](../protocol-specs).
