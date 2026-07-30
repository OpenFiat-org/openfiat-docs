---
title: Tutorials
---

# Tutorials

Each guide below is a real, runnable [SDK](../sdks) example — tested in
CI against a live node, not just prose. Start a local node first:

```bash
git clone git@github.com:OpenFiat-org/openfiat-core.git
cd openfiat-core
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

- **[Build a trading bot](trading-bot)** — publish an advertisement,
  open a reservation against it.
- **[Register a notification provider](notification-provider)** —
  register with the Service Registry, report a delivery.
- **[Register an oracle provider](oracle-provider)** — register with
  the Service Registry, publish a signed exchange rate.
