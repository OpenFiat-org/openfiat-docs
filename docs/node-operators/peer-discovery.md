---
title: Peer discovery
sidebar_position: 3
---

# Peer discovery

A node joins by dialing an entrypoint and finds the rest of the network
itself. Peer discovery (OFS-1100) exchanges known peers over the same
connection gossip already uses, so a node learns peers it was never given and
announces the addresses it is reachable at.

This is worth stating plainly because it was not always true, and the failure
was invisible: the discovery service was fully implemented and converged five
nodes in its own test, and no running node ever constructed one. Nodes
announced no address and learned no peer they had not been handed statically,
while looking entirely healthy from every local check. A node has one libp2p
swarm, only one thing can drive that swarm's event loop, and gossip had it —
so the service that did not own the swarm received nothing, for ever. Both now
share one connection, and messages are routed to one or the other by the
envelope's own OFS spec number.

Discovery is not a flag and cannot be turned off.

## The first connection

Nothing can find a network from nothing, so `--entrypoint` is still how a node
starts:

```bash
openfiat-node --entrypoint /dns4/openfiat.allenhark.com/udp/4001/quic-v1/p2p/12D3KooW...
```

Repeat it for several. A hostname works and is preferred — the node resolves
it at startup through the operating system's own resolver, so the cluster
survives the entrypoint's IP changing. **Keep the `/p2p/<peer id>` suffix**:
DNS is not authenticated, and the peer id is what makes a hijacked record fail
the handshake instead of silently becoming your only peer.

An entrypoint that will not resolve stops the node at startup rather than
being skipped. A node that quietly dropped one would come up with no peers at
all and look perfectly healthy while talking to nobody — which is exactly the
failure this section opened with.

Start with no entrypoint at all and the node says so, at `WARN`. That is
correct for the first node in a new cluster and wrong for everyone else.

## What your node announces about itself

Every address the node knows it is listening on, minus the bind wildcard.
`0.0.0.0` and `::` are listening instructions meaning "every local interface",
not destinations — and since `--gossip-bind-address` defaults to exactly that,
announcing it unfiltered is precisely the bug that leaves peers with nothing
to dial.

Loopback and private ranges are deliberately *not* filtered. Processes on one
host reach each other over loopback, a docker-compose cluster or a LAN reaches
its peers only by private address, and a single-host cluster is a real
deployment rather than a test artifact.

### Behind NAT, in a container, or on a cloud host with a mapped IP

The address your node binds is not the address peers can reach it at, and the
node cannot work the public one out. That is not an omission — by
construction, only something on the far side of the NAT can observe the public
address. So the operator declares it:

```bash
--external-addr /ip4/203.0.113.7/udp/4001/quic-v1
```

Repeatable. Declared addresses are announced **ahead of** the bound ones, so a
peer trying them in order connects on the first attempt instead of timing out
on `172.17.0.2`. Bound addresses are still announced too — dropping them would
fix the remote case by breaking the local one.

Omit the flag if your node is genuinely on a public interface. Its bound
address already is its public one.

## Asking a node what it knows

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

Three things are worth knowing about that response.

`self_peer_id` is the `12D3Koo…` form that goes in the entrypoint you publish
to other operators. A node that cannot state its own peer id cannot be joined,
and assembling it from a log line is how it gets typed wrong.

`announced_addresses` is what you are telling peers to dial, in the order they
will try them. "My node announces nothing" was invisible from outside for as
long as it was true, and an operator checking whether their `--external-addr`
took effect has nowhere else to look.

`successes` and `failures` are **this node's own** count of exchanges with
that peer. There is deliberately no uptime percentage and no health score:
folding the two counts into one number would present a single node's local
experience as a network-wide verdict, and two honest nodes can disagree about
both.
