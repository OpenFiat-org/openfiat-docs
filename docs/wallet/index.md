---
title: Wallet
---

# Wallet

There is a wallet view in the OpenFiat web application,
[openfiat-app](https://github.com/OpenFiat-org/openfiat-app) (`/wallet`), and
it still renders demo data — the app is being moved onto live data one route
at a time, and this is not one of the routes that has moved.

A standalone cross-platform wallet (Android, iOS, Linux, macOS, Windows, Web)
remains deferred. The placeholder for it in `openfiat-apps` was never
scaffolded, and that repository is no longer under active development.

Until then, a node never holds or signs anything for you: every mutation is a
payload your own keypair signs locally and submits — see
[method naming](../api) and either [SDK](../sdks) for the signing primitive.
