---
title: SDK
---

# SDK

Les SDK officiels sont maintenus dans un unique monorepo,
[openfiat-sdks](https://github.com/OpenFiat-org/openfiat-sdks). Les deux sont
réels, testés contre un nœud [`openfiat-core`](https://github.com/OpenFiat-org/openfiat-core)
en direct dans la CI (pas seulement en vérification de types) et couvrent toute
la [surface RPC](../api) : annonces, réservations, règlement, échange, litiges,
identité, gouvernance, fournisseurs de service, notifications, oracles, risque,
snapshots, sessions, et le [pont de chaîne Solana](https://github.com/OpenFiat-org/openfiat-specs/blob/main/Whitepaper/Specifications/OFS-4300%20-%20OpenFiat%20Chain%20Bridge%20Protocol%20(OCBP).md).

- **[Rust →](rust)** — `openfiat-sdk` dans le répertoire `rust/` du monorepo.
- **[TypeScript →](typescript)** — `@openfiat/sdk` dans `typescript/`.

Chaque SDK partage la même forme : un `Client`/`ClientConfig` pour parler à la
surface JSON-RPC d’un nœud, des méthodes typées `getX`/`sendX` par domaine (un
module par domaine — voir la propre disposition de modules de chaque SDK), et une
primitive de signature qui ne quitte jamais votre propre processus — un nœud ne
reçoit jamais qu’une charge déjà signée, exactement comme le `sendTransaction` de
Solana.

## Pas encore prêts

Python, Go, Swift, Kotlin et C# ont un échafaudage dans le monorepo (`python/`,
`go/`, `swift/`, `kotlin/`, `csharp/`) mais pas encore d’implémentation réelle —
suivi dans le `ROADMAP.md` du monorepo. Utilisez Rust ou TypeScript aujourd’hui ;
les contributions qui étendent l’un des autres sont bienvenues.
