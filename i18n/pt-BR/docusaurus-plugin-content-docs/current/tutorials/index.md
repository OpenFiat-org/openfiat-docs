---
title: Tutoriais
---

# Tutoriais

Cada guia abaixo é um exemplo real e executável de [SDK](../sdks) — testado no
CI contra um nó ao vivo, não apenas prosa. Inicie primeiro um nó local:

```bash
git clone git@github.com:OpenFiat-org/openfiat-core.git
cd openfiat-core
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

- **[Construa um bot de trading](trading-bot)** — publique um anúncio,
  abra uma reserva contra ele.
- **[Registre um provedor de notificações](notification-provider)** —
  registre-se no Registro de Serviços, reporte uma entrega.
- **[Registre um provedor de oráculo](oracle-provider)** — registre-se no
  Registro de Serviços, publique uma taxa de câmbio assinada.
