---
title: FAQ
---

# FAQ

**Is OpenFiat a blockchain?**
No. OpenFiat is a peer-to-peer coordination protocol built on top of Solana,
which handles settlement.

**Does my node need a separate IPFS daemon?**
No. A node serves protocol content itself, over its own libp2p identity, and
it is on by default — `--ipfs-api-url` and a Kubo daemon are no longer how
that works. See [content serving](../node-operators/content-serving).

**Do I have to list every peer my node should talk to?**
No. `--entrypoint` makes the first connection; after that a node learns peers
it was never given and announces the addresses it is reachable at. See
[peer discovery](../node-operators/peer-discovery).

**Who runs OpenFiat?**
AllenHark is leading initial development and funding early growth, with the
explicit long-term goal of progressive decentralization — see the
[Preface](../whitepaper) and Chapter 24 (Governance & Protocol Evolution).

**What license is the code under?**
Apache License 2.0, across every repository in
[OpenFiat-org](https://github.com/OpenFiat-org).

**Where do I report a security issue?**
See `SECURITY.md` in the relevant repository — do not open a public issue.
