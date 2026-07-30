---
title: Content serving
sidebar_position: 2
---

# Content serving

A protocol record never carries a file. It carries a CID — a self-describing
hash of content stored somewhere else — which keeps a 10 MB receipt out of a
gossip payload every node must store and replay, while still letting an
arbitrator establish that the image they are looking at is the one the party
signed.

Somebody still has to hold the bytes. That somebody is your node, and **it is
already doing it**: content serving is on by default and needs no
configuration.

## Why it is in the node and not a daemon

The first version of this pinned through a separate [Kubo](https://github.com/ipfs/kubo)
daemon, reached over `--ipfs-api-url`. That worked, and cost more than it
looked: a second peer identity on the network, a Go runtime and its resident
memory alongside the node's, and an unauthenticated `/api/v0` control surface
on port 5001 that lets anyone who reaches it pin, unpin and read everything
the daemon holds — mitigated only by binding it to loopback.

The deeper problem was the default. Running a daemon is work, so pinning was
opt-in, so almost nobody would have switched it on — and a durability
guarantee nobody opts into is not a guarantee. A node now speaks bitswap in
process, over the same libp2p identity it already gossips with, which is what
lets the behaviour be on by default. That in turn is what makes the reward
premium measure something real: with everyone serving, the multiplier
separates nodes that genuinely hold and answer for content from nodes that are
offline or have pruned, rather than separating operators who bothered to
install Go from those who did not.

## What your node holds, and what it does not

It holds the content referenced by attachment records it has **accepted**,
inside its retention window. It does not fetch every CID it sees — a node that
did would be storing whatever anyone chose to point it at.

That bound is not a promise, it is arithmetic: an attachment must name a
settlement, and a settlement needs a real reservation against real escrow. The
ceiling on what your disk is asked for is the network's actual trading volume,
not a stranger's patience.

Everything retrieved is checked against its CID before it is kept, whether it
came from a peer or from a gateway.

Ask your node what it is holding:

```bash
curl -s -X POST http://localhost:7080/rpc -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHeldContent","params":{"cid":"bafkrei..."}}'
# {"jsonrpc":"2.0","id":1,"result":{"content":"<base64>"}}   ← held
# {"jsonrpc":"2.0","id":1,"result":{"content":null}}          ← not held
```

## Where the first copy comes from

Bitswap moves blocks between peers that already have them; it does not create
the first one. Content enters the network through whatever pinning service the
interface uploaded it to, so the first node to want a CID has to fetch it from
the wider IPFS network, check the bytes against the CID, and serve it to its
peers from then on.

```bash
--content-gateway https://ipfs.example.com   # default: https://ipfs.filebase.io
```

The gateway is **untrusted transport**, not an authority. It can serve the
wrong bytes, no bytes, or log who asked for what; it cannot change which
content a CID names, because the CID is a hash of that content. Bytes that are
not what the CID names are refused, and a gateway that substitutes anything is
indistinguishable from one that is simply down.

Privacy is the one thing verification does not fix: whoever runs the gateway
learns that your node asked for this CID. That is why the flag exists — point
it at your own — and why it is a fallback rather than a first choice. Your
node prefers its peers.

## If you already run Kubo

`--ipfs-api-url http://127.0.0.1:5001` still works and now means something
narrower than it used to: protocol content is pinned into your daemon **as
well**, putting a copy somewhere your node's own retention window does not
govern. It is no longer how a node serves content.

## Turning it off, and what that costs

```bash
openfiat-node --no-content-serving
```

That node stores nothing and cannot answer a retrievability challenge, so it
earns the reduced share. That is the honest outcome — it is doing less for the
network — and it is the right flag if the disk genuinely is not there. The
node still challenges its peers either way: measuring who serves content is a
service a node performs whether or not it stores any itself.

### How the challenge works

One node picks a CID the network knows about, asks another node for the bytes,
and hashes what comes back. A content address *is* the hash of its content, so
returning the right bytes is not something a node can do without having them.
This is the one node-quality signal that is checked rather than believed.

Only some CIDs can decide the question. A raw-codec CID's digest is taken over
the file itself; a dag-pb CID addresses the root of a chunked DAG, so a peer
could return the correct file and still fail a naive hash check. Providers
switch between the two at 262,144 bytes, so challenges sample files at or
under 256 KiB — avatars almost always, attachments sometimes. That is enough
to separate a node that pins everything from one that pins nothing, which is
what the multiplier needs; it is not a proof that a node holds one specific
large attachment, and nothing claims it is.

### What the multiplier is

A node that answers keeps its full share; a node that cannot is scaled to
**0.7**, so a serving node earns roughly 1.43× an otherwise identical node
that does not. Both figures are `[PROPOSED — NEEDS SIGN-OFF]` — see OFS-4100
§9.2 and `crates/rewards/src/params.rs`.

The premium is expressed as a penalty for a reason that is not presentational.
Emission per epoch is fixed, and these multipliers decide how it is *divided*.
A bonus above 1.0 would not pay a pinning node out of thin air, it would mint
emission the Infrastructure bucket does not contain — which the reward
parameters reject outright. So the pinning node keeps its full share and the
non-pinning node yields part of its own.

0.7 rather than gossip-only's 0.4 because storage is a smaller favour to the
network than a chain connection: a node that does not pin still relays,
validates and serves everything else.

## How long content is kept

Not every node should carry the whole history.

```bash
--retention 30          # the default: a rolling 30-day window
--retention 365         # a longer window, still rolling
--retention archival    # keep everything, forever — an explicit choice
```

30 days is also the floor every node owes the network, so shorter values are
**refused** rather than quietly raised — a node configured for seven days that
silently ran for thirty would be doing something other than what its operator
asked.

That floor is what lets eviction and rewards coexist. Challenges are only ever
drawn from content inside it, so a rolling node that correctly evicted last
year's evidence is never asked about it and never loses its share for having
done the right thing. Equally, no node can shrink what it can be asked by
declaring a smaller window.
