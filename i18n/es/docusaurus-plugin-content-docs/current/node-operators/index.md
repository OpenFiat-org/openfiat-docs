---
title: Operadores de nodos
sidebar_position: 1
---

# Operadores de nodos

Los operadores de nodos son la columna vertebral de la red OpenFiat — ejecutan el
binario de referencia [`openfiat-node`](https://github.com/OpenFiat-org/openfiat-core)
y participan en el descubrimiento de peers, el gossip, el servicio de contenido y el
registro de servicios.

## Qué hace un nodo sin configuración alguna

`openfiat-node` se configura por completo mediante flags de línea de comandos — no hay
respaldo por variables de entorno ni archivo de configuración, deliberadamente, para que
`systemctl cat openfiat-node` muestre exactamente lo que se le dio a un nodo en marcha
en vez de mandarte a un ejercicio de arqueología por perfiles de shell y
archivos de unidad. `openfiat-node --help` es toda la superficie.

Ejecútalo sin nada configurado y ya:

- genera o carga su identidad (un `wallet.json` en formato CLI de Solana) y usa
  esa única clave como su clave de firma de Solana y como su peer id de libp2p;
- sirve JSON-RPC, WebSocket y REST en `0.0.0.0:7080`;
- escucha peers en `/ip4/0.0.0.0/udp/4001/quic-v1`, anuncia las direcciones
  en las que es alcanzable, y aprende peers que nunca se le dieron — consulta
  [Descubrimiento de peers](./peer-discovery);
- guarda el contenido al que apuntan los registros del protocolo y lo sirve sobre bitswap en
  su propia identidad libp2p — consulta [Servicio de contenido](./content-serving);
- conserva ese contenido durante 30 días móviles (`--retention`), así que ejecutar un nodo
  es un compromiso de almacenamiento acotado en vez de uno abierto.

Dos cosas que *no* hace sin que se le pida: hablar con Solana (`--solana-rpc-url` lo
mueve de `GossipOnly` a `RpcConnected`) y producir snapshots para otros
(`--snapshot-public-url`). Ambas son opcionales porque ambas hacen una afirmación al
resto de la red que solo el operador puede avalar.

## Qué es opcional, y qué cuesta

| Para deshabilitar | Haz esto | A qué renuncias |
| --- | --- | --- |
| Conectividad con Solana | omite `--solana-rpc-url` | El nodo permanece `GossipOnly`: las respuestas on-chain llegan de segunda mano por gossip y pueden retrasarse. Sigue sirviendo el mercado y retransmite transacciones a un peer conectado por RPC, y gana la parte reducida de conectividad. |
| Servicio de contenido | `--no-content-serving` | El nodo no almacena contenido de adjuntos y no puede responder a un desafío de recuperabilidad, así que gana la parte reducida. Aún desafía a sus peers. |
| Producir snapshots | omite `--snapshot-public-url` | Nadie puede hacer bootstrap desde este nodo. *Consumir* snapshots no necesita configuración. |
| Descubrimiento de peers | no es posible | No es un flag. Un nodo que no anunciara ninguna dirección y no aprendiera ningún peer parecería sano a cada comprobación local mientras no habla con nadie. |

## Ir más allá

- **El recorrido completo del operador** — [`docs/getting-started.md`](https://github.com/OpenFiat-org/openfiat-core/blob/main/docs/getting-started.md)
  en `openfiat-core`: compilación, cada flag con su valor por defecto real, el entrypoint
  del devnet público, poner TLS y nginx delante del nodo, y los
  ids de programa on-chain.
- **Despliegue** — [openfiat-infra](https://github.com/OpenFiat-org/openfiat-infra)
  para imágenes Docker, el chart de Helm de Kubernetes y módulos de Terraform;
  `packaging/systemd` y `packaging/windows` en `openfiat-core` para ejecutar
  el binario directamente como un servicio.
- **Redes de prueba locales** — [openfiat-devtools](https://github.com/OpenFiat-org/openfiat-devtools)
  (`testnet/`, `devnet/`).
- **Reputación y QoS ponderado por stake** — OFS-1600 en
  [Especificaciones del protocolo](../protocol-specs).
