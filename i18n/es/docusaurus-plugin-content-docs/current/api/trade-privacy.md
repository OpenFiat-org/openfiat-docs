---
title: Qué devuelve una lectura pública
sidebar_position: 3
---

# Qué devuelve una lectura pública

`getSettlement`, `getSettlements`, `getReservation`, `getReservations`,
`getDispute` y `getDisputes` son lecturas abiertas, no autenticadas, y ya no
devuelven la identidad de las partes. Una parte lee sus propios registros por completo mediante
los [métodos con prueba de cartera](./wallet-proof-reads.md).

## Por qué redacción en lugar de autenticación

Un explorador que muestra el volumen, los estados y los tiempos de liquidación es una
vista pública legítima de una red pública. Poner una firma delante
rompería eso mientras empuja a cualquiera con determinación de vuelta al gossip en bruto, lo cual no logra
nada. Lo que el explorador nunca necesitó es *quién* — así que la lectura pública conserva
todo excepto la identidad.

Lo que la identidad ensambla es el grafo de operaciones, y el argumento contra
entregarlo se expone por completo en la página de
[lecturas con prueba de cartera](./wallet-proof-reads.md): en un mercado fiat entre pares,
saber a qué comerciante vuelve siempre una cartera y quiénes son los habituales de un
comerciante ocupado es una cuestión de seguridad física más que una preferencia. Una
sola llamada no autenticada solía reconstruirlo.

## Cuánto vale esto honestamente

Estos registros se difunden por gossip a cada nodo. Cualquiera que ejecute uno los lee
todos, y la redacción no cambia eso. Lo que se protege es la *facilidad* de la
consulta — la diferencia entre hacer `curl` al nodo de acceso público de otra persona
y levantar un nodo para indexar la red. Esa diferencia es la mayor parte de lo que
la recolección casual está hecha.

Enunciarlo con claridad importa más de lo que podría parecer: un integrador que
crea que estos registros son confidenciales construirá algo que se apoya en una
garantía que el protocolo no ofrece.

## Las formas

### Settlement

| Conservado | Eliminado |
| --- | --- |
| `id`, `reservation_id`, `amount`, `state` | `buyer`, `buyer_public_key` |
| `escrow_release_signature` | `seller`, `seller_public_key` |
| `payment_submitted_at`, `merchant_responded_at` | `payment_reference` |
| `payment_discrepancy`, `created_at`, `updated_at` | |

`escrow_release_signature` permanece porque nombra una transacción on-chain que
cualquiera ya puede leer en Solana, y es lo que hace que una liquidación sea
verificable de forma independiente.

`payment_reference` es posiblemente la peor de las dos eliminaciones: es texto libre
en el que un comprador pone su propia referencia bancaria, así que rutinariamente lleva un nombre real
o un número de cuenta.

### Reservation

| Conservado | Eliminado |
| --- | --- |
| `id`, `advertisement_id`, `amount`, `state` | `requester` |
| `requested_at`, `updated_at`, `expires_at` | `requester_public_key` |

`advertisement_id` se conserva deliberadamente. Un anuncio es una oferta pública
y ya lleva el peer id de su comerciante en cada fila del libro de órdenes, así que
revela un extremo de una arista que nunca fue privada. Lo que no revela
es el otro extremo — que es lo que la convierte en una arista.

### Dispute

| Conservado | Eliminado |
| --- | --- |
| `id`, `settlement_id`, `status`, `resolution` | `buyer`, `seller`, `opener` y sus claves |
| `required_arbitrators`, `arbitrators_seated` | `reason` |
| `commitments`, `reveals` (recuentos) | `arbitrators`, `arbitrator_keys` |
| `onchain_execution_signature` | los compromisos y revelaciones individuales |
| `opened_at`, `updated_at` | los indicadores de acuerdo mutuo |

Ten en cuenta que aquí `commitments` y `reveals` son **recuentos**, no listas — suficiente
para que un explorador muestre un caso avanzando, sin el voto de nadie ligado a
su nombre.

Tres razones distintas para lo que se descarta. Las partes, porque una disputa es
el caso en que saber quién se peleó con quién es lo más obviamente digno de
usarse mal. `reason`, porque es texto libre sobre un desacuerdo real por
dinero real y nombra personas, bancos y referencias por defecto. Las
listas de árbitros, porque un árbitro es un proveedor registrado cuya
identidad no es en sí un secreto — pero *qué árbitro tomó qué caso, y
cómo votó* es exactamente el emparejamiento que hace que valga la pena presionar a uno.
Los indicadores de acuerdo mutuo van con ellos: «el vendedor ha aceptado y el comprador
no» es una posición de negociación, y publicarlo a los espectadores cambia una
negociación entre dos personas.

## Si estás añadiendo un campo

Un campo pertenece a una vista pública solo si dice algo sobre la *operación*
más que sobre las *personas*. En caso de duda se queda fuera: añadir uno después
es una nota de versión, y quitar uno es una divulgación que ya ocurrió.
