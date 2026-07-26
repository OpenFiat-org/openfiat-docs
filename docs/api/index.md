---
title: API
---

# API

`openfiat-core` exposes JSON-RPC, gRPC, WebSocket, and REST/OpenAPI surfaces
via its `rpc` and `api` crates. An OpenAPI document and interactive reference
will be published here once those surfaces stabilize.

In the meantime, the typed `Client` in each [SDK](../sdks) is the recommended
integration point rather than calling the RPC surface directly.
