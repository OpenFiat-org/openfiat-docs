---
title: Tutoriales
---

# Tutoriales

Cada guía de abajo es un ejemplo real y ejecutable de [SDK](../sdks) — probado en
CI contra un nodo en vivo, no solo prosa. Arranca primero un nodo local:

```bash
git clone git@github.com:OpenFiat-org/openfiat-core.git
cd openfiat-core
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

- **[Construye un bot de trading](trading-bot)** — publica un anuncio,
  abre una reserva contra él.
- **[Registra un proveedor de notificaciones](notification-provider)** —
  regístrate en el Registro de Servicios, reporta una entrega.
- **[Registra un proveedor de oráculo](oracle-provider)** — regístrate en
  el Registro de Servicios, publica un tipo de cambio firmado.
