---
title: Tutoriels
---

# Tutoriels

Chaque guide ci-dessous est un exemple [SDK](../sdks) réel et exécutable — testé
dans la CI contre un nœud en direct, pas seulement de la prose. Démarrez d’abord
un nœud local :

```bash
git clone git@github.com:OpenFiat-org/openfiat-core.git
cd openfiat-core
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

- **[Construire un bot de trading](trading-bot)** — publiez une annonce,
  ouvrez une réservation contre elle.
- **[Enregistrer un fournisseur de notifications](notification-provider)** —
  enregistrez-vous auprès du Registre de services, signalez une livraison.
- **[Enregistrer un fournisseur d’oracle](oracle-provider)** — enregistrez-vous
  auprès du Registre de services, publiez un taux de change signé.
