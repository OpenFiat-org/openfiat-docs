---
title: Lecturas con prueba de cartera
sidebar_position: 2
---

# Lecturas con prueba de cartera

Casi toda lectura en la [superficie JSON-RPC](./index.md) de un nodo es abierta, porque
lo que devuelve ya está replicado en cada nodo. Un puñado no lo son, y
la línea que las separa no es «¿esto es secreto?» — aquí nada es secreto — sino
«¿responder esto a un desconocido ensambla algo que el protocolo
deja disperso deliberadamente?».

## Lo que se protege es el grafo de operaciones

Un endpoint que responde *con quién opera esta cartera, y con qué frecuencia*
entrega a cualquiera un mapa de relaciones comerciales reales: a qué comerciante vuelve
siempre una cartera, quiénes son los habituales de un comerciante ocupado, y por tanto quién
merece ser seguido hasta casa. En un mercado fiat entre pares eso es una
cuestión de seguridad física más que una preferencia.

Ese argumento se hizo una vez y se aplicó en un método
(`getCounterparties`), mientras el mismo grafo seguía disponible a través de
`getSettlements`, `getReservations` y `getDisputes` — ninguno de los cuales tomaba un
parámetro, y todos los cuales devolvían cada registro de la red con ambas
partes nombradas y con clave. La puerta no era débil; se le dio la vuelta. También eran
tres métodos en lugar de uno: una reserva nombra al comprador y su
anuncio nombra al comerciante, así que la misma arista estaba disponible un paso
antes, incluso para operaciones que nunca se liquidaron.

Por eso las lecturas públicas están ahora [redactadas](./trade-privacy.md), y una parte lee
sus propios registros por completo demostrando que posee la cartera.

## El handshake

No hay cuentas en este protocolo, así que «¿de verdad eres tú?» solo puede
responderse pidiendo al llamante que firme algo que no podría haber firmado por
adelantado.

### 1. Pide un nonce

```json
{ "method": "getWalletChallenge", "params": { "wallet": "<base64 PeerId>" } }
```

```json
{ "result": { "subject": "<base64 PeerId>", "nonce": "<64 hex chars>", "expires_at": 1753800300000 } }
```

La emisión es deliberadamente abierta. Un nonce no vale nada sin la clave privada
que lo firma, y exigir una firma para obtener aquello que firmas sería
circular; la respuesta no confirma nada sobre la cartera, ni siquiera que
exista. Los desafíos viven solo en memoria y expiran tras cinco minutos — lo
bastante para que una persona lea y apruebe un aviso de cartera, lo bastante corto para que un
nonce no gastado no quede tirado por ahí.

`getCounterpartiesChallenge` y `getProviderEarningsChallenge` son el mismo
emisor bajo distintos nombres. Un nonce responde exactamente a una llamada, en cualquier
superficie en que se gaste.

### 2. Firma el desafío

Los bytes a firmar son la cadena UTF-8:

```
<domain>:<subject>:<nonce>
```

`subject` es el peer id canónico en base64 con el que volvió el desafío, no
cualquier grafía base64 que hayas enviado. `domain` es fijo por método:

| Método | Dominio |
| --- | --- |
| `getMySettlements` | `openfiat-my-settlements` |
| `getMyReservations` | `openfiat-my-reservations` |
| `getMyDisputes` | `openfiat-my-disputes` |
| `getCounterparties` | `openfiat-counterparties` |
| `getProviderEarnings` | `openfiat-earnings` |

El separador de dominio es la razón por la que una firma recopilada para una superficie
con puerta no puede presentarse en otra, aunque ambas identifiquen a su sujeto de la misma
forma y saquen nonces del mismo libro.

### 3. Llama al método

```json
{
  "method": "getMySettlements",
  "params": {
    "wallet": "<base64 PeerId>",
    "public_key": "<base64 raw 32-byte Ed25519 public key>",
    "nonce": "<the nonce from step 1>",
    "signature": "<base64 64-byte Ed25519 signature>"
  }
}
```

`getMyReservations`, `getMyDisputes` y `getCounterparties` toman exactamente los
mismos cuatro campos. La clave pública se envía de forma explícita en lugar de recuperarse de
`wallet`, así que la afirmación de identidad es algo que el llamante declara y el nodo
comprueba, no algo que el nodo infiere por él — debe derivarse
exactamente a la cartera por la que se pregunta.

Lo que vuelve no está redactado, y solo para los registros de los que la cartera es
parte. `getMyDisputes` también responde a un árbitro asignado, porque leer el caso
entero es su trabajo.

## Detalles que importan si estás implementando esto

**Rechazo, no filtrado.** Un llamante que no puede demostrar la cartera recibe un
error, nunca una respuesta filtrada. Una implementación con filtrado parece idéntica en
cada test que pasa, justo hasta que una refactorización elimina el filtro; un rechazo falla
en voz alta y de inmediato.

**Orden de comprobaciones.** La comprobación de derivación de clave ocurre primero, antes de que se toque
el nonce, para que el intento fallido de un desconocido no pueda gastar el nonce que su verdadero
dueño está a medio firmar. El nonce se consume luego *antes* de que se verifique la
firma, para que presentar una firma capturada queme el nonce en lugar de
reproducirlo.

**«Desconocido» y «ya gastado» son el mismo error.** Distinguirlos
confirmaría que alguna otra parte está a mitad de handshake para ese sujeto.

**No se almacena nada nuevo.** Los desafíos pendientes están en memoria y las respuestas
se pliegan bajo demanda a partir de registros que el nodo ya replica. Un operador de nodo
no gana ningún registro de quién preguntó qué — lo cual importa, porque el operador es
exactamente la parte para la que esto no debe construir en silencio un dossier.
