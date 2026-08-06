---
title: Portefeuille
---

# Portefeuille

Il y a une vue portefeuille dans l’application web d’OpenFiat,
[openfiat-app](https://github.com/OpenFiat-org/openfiat-app) (`/wallet`), et elle
rend encore des données de démonstration — l’app passe aux données en direct une
route à la fois, et ce n’est pas l’une des routes qui ont migré.

Un portefeuille autonome multiplateforme (Android, iOS, Linux, macOS, Windows,
Web) reste reporté. L’emplacement réservé pour lui dans `openfiat-apps` n’a
jamais été échafaudé, et ce dépôt n’est plus en développement actif.

D’ici là, un nœud ne détient ni ne signe jamais rien pour vous : chaque mutation
est une charge que votre propre paire de clés signe localement et soumet — voir
[nommage des méthodes](../api) et l’un ou l’autre [SDK](../sdks) pour la
primitive de signature.
