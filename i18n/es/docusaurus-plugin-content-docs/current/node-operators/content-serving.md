---
title: Servicio de contenido
sidebar_position: 2
---

# Servicio de contenido

Un registro del protocolo nunca lleva un archivo. Lleva un CID — un hash
autodescriptivo de contenido almacenado en otro lugar — que mantiene un recibo de 10 MB fuera de
una carga de gossip que cada nodo debe almacenar y reproducir, mientras aún permite a un
árbitro establecer que la imagen que mira es la que firmó la parte.

Alguien todavía tiene que guardar los bytes. Ese alguien es tu nodo, y **ya lo
está haciendo**: el servicio de contenido está activado por defecto y no necesita
configuración.

## Por qué está en el nodo y no en un daemon

La primera versión de esto fijaba (pin) a través de un daemon [Kubo](https://github.com/ipfs/kubo)
aparte, alcanzado por `--ipfs-api-url`. Eso funcionaba, y costaba más de lo que
parecía: una segunda identidad de peer en la red, un runtime de Go y su memoria
residente junto a la del nodo, y una superficie de control `/api/v0` no autenticada
en el puerto 5001 que permite a cualquiera que la alcance fijar, desfijar y leer todo lo
que el daemon guarda — mitigada solo por vincularla a loopback.

El problema más profundo era el valor por defecto. Ejecutar un daemon es trabajo, así que fijar era
opcional, así que casi nadie lo habría activado — y una garantía de durabilidad
en la que nadie opta no es una garantía. Un nodo ahora habla bitswap en
proceso, sobre la misma identidad libp2p con la que ya hace gossip, que es lo que
permite que el comportamiento esté activado por defecto. Eso a su vez es lo que hace que la
prima de recompensa mida algo real: con todos sirviendo, el multiplicador
separa los nodos que genuinamente guardan y responden por el contenido de los nodos que están
fuera de línea o han podado, en vez de separar a los operadores que se molestaron en
instalar Go de los que no.

## Qué guarda tu nodo, y qué no

Guarda el contenido referenciado por los registros de adjuntos que ha **aceptado**,
dentro de su ventana de retención. No obtiene cada CID que ve — un nodo que
lo hiciera estaría almacenando lo que cualquiera decidiera apuntarle.

Ese límite no es una promesa, es aritmética: un adjunto debe nombrar una
liquidación, y una liquidación necesita una reserva real contra un escrow real. El
techo de lo que se le pide a tu disco es el volumen de operaciones real de la red,
no la paciencia de un desconocido.

Todo lo recuperado se comprueba contra su CID antes de guardarse, ya sea que
viniera de un peer o de un gateway.

Pregunta a tu nodo qué está guardando:

```bash
curl -s -X POST http://localhost:7080/rpc -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHeldContent","params":{"cid":"bafkrei..."}}'
# {"jsonrpc":"2.0","id":1,"result":{"content":"<base64>"}}   ← guardado
# {"jsonrpc":"2.0","id":1,"result":{"content":null}}          ← no guardado
```

## De dónde viene la primera copia

Bitswap mueve bloques entre peers que ya los tienen; no crea
el primero. El contenido entra en la red a través de cualquier servicio de pinning al que la
interfaz lo subió, así que el primer nodo que quiere un CID tiene que obtenerlo de la
red IPFS más amplia, comprobar los bytes contra el CID, y servirlo a sus
peers desde entonces.

```bash
--content-gateway https://ipfs.example.com   # por defecto: https://ipfs.filebase.io
```

El gateway es **transporte no confiable**, no una autoridad. Puede servir los
bytes equivocados, ningún byte, o registrar quién pidió qué; no puede cambiar qué
contenido nombra un CID, porque el CID es un hash de ese contenido. Los bytes que
no son lo que el CID nombra se rechazan, y un gateway que sustituye cualquier cosa es
indistinguible de uno que simplemente está caído.

La privacidad es lo único que la verificación no arregla: quienquiera que ejecute el gateway
aprende que tu nodo pidió este CID. Por eso existe el flag — apúntalo
al tuyo propio — y por eso es un respaldo en lugar de una primera opción. Tu
nodo prefiere a sus peers.

## Si ya ejecutas Kubo

`--ipfs-api-url http://127.0.0.1:5001` todavía funciona y ahora significa algo
más estrecho que antes: el contenido del protocolo se fija en tu daemon **además**,
poniendo una copia en algún lugar que la propia ventana de retención de tu nodo no
gobierna. Ya no es cómo un nodo sirve contenido.

## Apagarlo, y qué cuesta eso

```bash
openfiat-node --no-content-serving
```

Ese nodo no almacena nada y no puede responder a un desafío de recuperabilidad, así que
gana la parte reducida. Ese es el resultado honesto — está haciendo menos por la
red — y es el flag correcto si el disco genuinamente no está ahí. El
nodo aún desafía a sus peers de cualquier modo: medir quién sirve contenido es un
servicio que un nodo realiza almacene o no algo él mismo.

### Cómo funciona el desafío

Un nodo elige un CID que la red conoce, pide a otro nodo los bytes,
y hashea lo que vuelve. Una dirección de contenido *es* el hash de su contenido, así que
devolver los bytes correctos no es algo que un nodo pueda hacer sin tenerlos.
Esta es la única señal de calidad de nodo que se comprueba en vez de creerse.

Solo algunos CID pueden decidir la cuestión. El digest de un CID de codec raw se toma sobre
el archivo mismo; un CID dag-pb direcciona la raíz de un DAG troceado, así que un peer
podría devolver el archivo correcto y aun así fallar una comprobación de hash ingenua. Los proveedores
alternan entre ambos a los 262 144 bytes, así que los desafíos muestrean archivos en o
por debajo de 256 KiB — avatares casi siempre, adjuntos a veces. Eso es suficiente
para separar un nodo que fija todo de uno que no fija nada, que es
lo que el multiplicador necesita; no es una prueba de que un nodo guarde un
adjunto grande específico, y nada afirma que lo sea.

### Qué es el multiplicador

Un nodo que responde conserva su parte completa; un nodo que no puede se escala a
**0.7**, así que un nodo que sirve gana aproximadamente 1.43× lo que un nodo por lo demás idéntico
que no sirve. Ambas cifras son `[PROPOSED — NEEDS SIGN-OFF]` — consulta OFS-4100
§9.2 y `crates/rewards/src/params.rs`.

La prima se expresa como una penalización por una razón que no es de presentación.
La emisión por época es fija, y estos multiplicadores deciden cómo se *divide*.
Un bono por encima de 1.0 no pagaría a un nodo que fija de la nada, acuñaría
emisión que el balde de Infraestructura no contiene — lo que los parámetros de
recompensa rechazan de plano. Así que el nodo que fija conserva su parte completa y el
nodo que no fija cede parte de la suya.

0.7 en vez del 0.4 del solo-gossip porque el almacenamiento es un favor menor a la
red que una conexión a la cadena: un nodo que no fija aún retransmite,
valida y sirve todo lo demás.

## Cuánto tiempo se guarda el contenido

No todo nodo debería llevar toda la historia.

```bash
--retention 30          # el valor por defecto: una ventana móvil de 30 días
--retention 365         # una ventana más larga, todavía móvil
--retention archival    # guardarlo todo, para siempre — una elección explícita
```

30 días es además el mínimo que cada nodo le debe a la red, así que los valores más cortos se
**rechazan** en lugar de elevarse en silencio — un nodo configurado para siete días que
corriera en silencio durante treinta estaría haciendo algo distinto de lo que su operador
pidió.

Ese mínimo es lo que permite coexistir a la expulsión y las recompensas. Los desafíos solo se
extraen siempre de contenido dentro de él, así que un nodo móvil que expulsó correctamente
la evidencia del año pasado nunca es interrogado sobre ella y nunca pierde su parte por haber
hecho lo correcto. Igualmente, ningún nodo puede reducir aquello por lo que puede ser interrogado
declarando una ventana más pequeña.
