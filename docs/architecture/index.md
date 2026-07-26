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
- **Trade layer** — advertisements, reservations, settlement, disputes.
- **Trust layer** — identity claims, reputation, risk intelligence.
- **Coordination layer** — governance, notifications, oracles.

See the [reference implementation](https://github.com/OpenFiat-org/openfiat-core)
for the current crate-level breakdown.
