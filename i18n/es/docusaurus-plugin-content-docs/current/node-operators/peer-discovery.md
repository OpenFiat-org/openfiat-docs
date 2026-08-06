---
title: Descubrimiento de peers
sidebar_position: 3
---

# Descubrimiento de peers

Un nodo se une marcando un entrypoint y encuentra el resto de la red
por sí mismo. El descubrimiento de peers (OFS-1100) intercambia peers conocidos sobre la misma
conexión que el gossip ya usa, así que un nodo aprende peers que nunca se le dieron y
anuncia las direcciones en las que es alcanzable.

Vale la pena decirlo con claridad porque no siempre fue cierto, y el fallo
era invisible: el servicio de descubrimiento estaba plenamente implementado y convergió cinco
nodos en su propio test, y ningún nodo en marcha construyó jamás uno. Los nodos
no anunciaban ninguna dirección y no aprendían ningún peer que no se les hubiera dado
estáticamente, mientras parecían enteramente sanos en cada comprobación local. Un nodo tiene un swarm
libp2p, solo una cosa puede impulsar el bucle de eventos de ese swarm, y el gossip la tenía —
así que el servicio que no era dueño del swarm no recibía nada, para siempre. Ambos ahora
comparten una conexión, y los mensajes se enrutan a uno o al otro por el propio número de spec
OFS del sobre.

El descubrimiento no es un flag y no puede apagarse.

## La primera conexión

Nada puede encontrar una red desde la nada, así que `--entrypoint` sigue siendo cómo un nodo
arranca:

```bash
openfiat-node --entrypoint /dns4/openfiat.allenhark.com/udp/4001/quic-v1/p2p/12D3KooW...
```

Repítelo para varios. Un hostname funciona y es preferido — el nodo lo resuelve
al arrancar mediante el propio resolvedor del sistema operativo, así que el clúster
sobrevive a que la IP del entrypoint cambie. **Conserva el sufijo `/p2p/<peer id>`**:
el DNS no está autenticado, y el peer id es lo que hace que un registro secuestrado falle
el handshake en vez de convertirse en silencio en tu único peer.

Un entrypoint que no vaya a resolverse detiene el nodo al arrancar en lugar de
saltarse. Un nodo que descartara uno en silencio arrancaría sin peers en
absoluto y parecería perfectamente sano mientras no habla con nadie — que es exactamente el
fallo con que abrió esta sección.

Arranca sin ningún entrypoint y el nodo lo dice, en `WARN`. Eso es
correcto para el primer nodo de un clúster nuevo y erróneo para todos los demás.

## Qué anuncia tu nodo sobre sí mismo

Cada dirección en la que el nodo sabe que escucha, menos el comodín de bind.
`0.0.0.0` y `::` son instrucciones de escucha que significan «cada interfaz local»,
no destinos — y como `--gossip-bind-address` por defecto es exactamente eso,
anunciarlo sin filtrar es precisamente el bug que deja a los peers sin nada
que marcar.

Los rangos de loopback y privados deliberadamente *no* se filtran. Los procesos en un
host se alcanzan entre sí por loopback, un clúster de docker-compose o una LAN alcanza
sus peers solo por dirección privada, y un clúster de un solo host es un despliegue
real en vez de un artefacto de test.

### Tras NAT, en un contenedor, o en un host de nube con una IP mapeada

La dirección a la que tu nodo hace bind no es la dirección a la que los peers pueden alcanzarlo,
y el nodo no puede deducir la pública. Eso no es una omisión — por
construcción, solo algo al otro lado del NAT puede observar la dirección
pública. Así que el operador la declara:

```bash
--external-addr /ip4/203.0.113.7/udp/4001/quic-v1
```

Repetible. Las direcciones declaradas se anuncian **antes que** las vinculadas, así que un
peer que las prueba en orden conecta al primer intento en lugar de agotar el tiempo
en `172.17.0.2`. Las direcciones vinculadas también se anuncian — descartarlas
arreglaría el caso remoto rompiendo el local.

Omite el flag si tu nodo está genuinamente en una interfaz pública. Su dirección
vinculada ya es su pública.

## Preguntar a un nodo qué sabe

```bash
curl -s -X POST http://localhost:7080/rpc -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getPeers","params":{}}' | jq
```

```json
{
  "self_peer_id": "12D3KooWK9hQ7TwbfvFiaAxUbRFCkdhS7iEpAJDnewNL1anyREQ1",
  "announced_addresses": ["/ip4/203.0.113.7/udp/4001/quic-v1"],
  "peers": [
    {
      "peer_id": "12D3KooW...",
      "addresses": ["/ip4/198.51.100.4/udp/4001/quic-v1"],
      "node_version": "openfiat/0.1.0",
      "supported_ofs": [1000, 1100, 1200, 1300, 1400, 1500, 2000, 2100, 2200, 2300, 2400, 3000, 4000, 4300, 6000, 7000, 8200],
      "roles": ["MerchantGateway", "OracleProvider", "NotificationGateway", "RiskIntelligenceProvider"],
      "last_seen": 1753800000000,
      "latency_ms": 42,
      "successes": 17,
      "failures": 0
    }
  ]
}
```

Tres cosas vale la pena saber sobre esa respuesta.

`self_peer_id` es la forma `12D3Koo…` que va en el entrypoint que publicas
a otros operadores. Un nodo que no puede declarar su propio peer id no puede ser unido,
y ensamblarlo desde una línea de log es cómo se teclea mal.

`announced_addresses` es lo que les dices a los peers que marquen, en el orden en que
lo intentarán. «Mi nodo no anuncia nada» era invisible desde fuera mientras
fue cierto, y un operador que comprueba si su `--external-addr`
surtió efecto no tiene ningún otro sitio donde mirar.

`successes` y `failures` son el recuento **propio de este nodo** de intercambios con
ese peer. Deliberadamente no hay porcentaje de tiempo activo ni puntuación de salud:
plegar los dos recuentos en un número presentaría la experiencia local de un solo nodo
como un veredicto de toda la red, y dos nodos honestos pueden discrepar sobre
ambos.
