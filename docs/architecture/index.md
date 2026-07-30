---
title: Architecture
---

# Architecture

OpenFiat is not a blockchain — it is a decentralized peer-to-peer protocol
built on top of Solana. Solana provides secure, transparent, on-chain
settlement through audited smart contracts; OpenFiat provides the
peer-to-peer coordination network responsible for advertisements, trade
discovery, encrypted communication, reputation, governance, and
notifications.

## Layers

- **Network layer** — peer discovery, gossip, snapshot/session sync, service registry (see `openfiat-core/crates/{network,discovery,gossip,snapshot,sessions,registry}`).
- **Content layer** — the files protocol records point at, addressed by CID and served between nodes over bitswap (`crates/content`).
- **Trade layer** — advertisements, reservations, settlement, disputes.
- **Trust layer** — identity claims, reputation, risk intelligence.
- **Coordination layer** — governance, notifications, oracles.

Every one of those runs inside a single process and, on the wire, over a
single libp2p identity — no second daemon and no second peer id. Discovery and
gossip multiplex over one connection and are routed apart by the OFS spec
number their envelopes carry; content serving speaks standard
`/ipfs/bitswap/1.2.0` on the same swarm, which is what lets any IPFS peer
fetch protocol content from a node directly.

See the [reference implementation](https://github.com/OpenFiat-org/openfiat-core)
for the current crate-level breakdown, and
[`docs/architecture.md`](https://github.com/OpenFiat-org/openfiat-core/blob/main/docs/architecture.md)
there for the crate dependency graph, wire format and transport.
