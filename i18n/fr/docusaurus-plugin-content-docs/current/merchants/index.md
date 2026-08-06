---
title: Commerçants
---

# Commerçants

Les commerçants publient des annonces, gèrent réservations et règlements, et
suivent des analyses via l’application web d’OpenFiat,
[openfiat-app](https://github.com/OpenFiat-org/openfiat-app) — les profils de
commerçant, l’assistant de publication d’annonce et la salle d’échange y vivent.

Cette app passe de données de démonstration simulées à des données en direct une
route à la fois, et les flux de commerçant sont parmi les routes qui rendent
encore des données de démo. Traitez ce que vous y voyez comme la forme prévue, et
non comme votre propre carnet. La surface côté nœud en dessous —
`sendAdvertisementCreate`, `sendAdvertisementPriceUpdate`,
`sendAdvertisementDisable`, et les méthodes de réservation et de règlement — est
réelle aujourd’hui et documentée dans la [référence de l’API](../api).

L’ancien échafaudage `openfiat-apps/merchant` n’est plus en développement actif ;
le nouveau travail de frontend est concentré dans `openfiat-app`.

Cette section couvrira l’intégration, les bonnes pratiques d’annonce, la gestion
des litiges et le rapprochement des règlements à mesure que ces flux passent aux
données en direct.
