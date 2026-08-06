---
title: Arquitectura
---

# Arquitectura

OpenFiat no es una blockchain — es un protocolo descentralizado entre pares
construido sobre Solana. Solana aporta liquidación on-chain segura y transparente
mediante contratos inteligentes auditados; OpenFiat aporta la
red de coordinación entre pares responsable de los anuncios, el descubrimiento de
operaciones, la comunicación cifrada, la reputación, la gobernanza y las
notificaciones.

## Capas

- **Capa de red** — descubrimiento de peers, gossip, sincronización de snapshot/sesión, registro de servicios (consulta `openfiat-core/crates/{network,discovery,gossip,snapshot,sessions,registry}`).
- **Capa de contenido** — los archivos a los que apuntan los registros del protocolo, direccionados por CID y servidos entre nodos sobre bitswap (`crates/content`).
- **Capa de operación** — anuncios, reservas, liquidación, disputas.
- **Capa de confianza** — declaraciones de identidad, reputación, inteligencia de riesgo.
- **Capa de coordinación** — gobernanza, notificaciones, oráculos.

Cada una de ellas corre dentro de un único proceso y, en el cable, sobre una
única identidad libp2p — sin un segundo daemon y sin un segundo peer id. El descubrimiento y
el gossip se multiplexan sobre una conexión y se enrutan por separado según el número de spec
OFS que llevan sus sobres; el servicio de contenido habla el estándar
`/ipfs/bitswap/1.2.0` en el mismo swarm, que es lo que permite a cualquier peer IPFS
obtener contenido del protocolo directamente de un nodo.

Consulta la [implementación de referencia](https://github.com/OpenFiat-org/openfiat-core)
para el desglose actual a nivel de crate, y
[`docs/architecture.md`](https://github.com/OpenFiat-org/openfiat-core/blob/main/docs/architecture.md)
allí para el grafo de dependencias de crates, el formato de cable y el transporte.
