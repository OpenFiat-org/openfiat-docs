---
title: Cómo se resuelve una disputa
---

# Cómo se resuelve una disputa

Una disputa tiene dos mitades, y solo una de ellas decide algo.

La **capa off-chain** recopila. Verifica la firma de cada árbitro,
comprueba una revelación contra el compromiso previo de ese árbitro, rechaza una
revelación de una cartera que nunca se comprometió, descarta duplicados y
replica el resultado para que cada nodo vea la misma evidencia.

La **cadena** decide. Cuenta los votos revelados según sus propias reglas —
ponderados por stake, con un mínimo de votos contados, reabriendo una ronda en caso de empate
en lugar de deshacerlo — y mueve el escrow.

## La capa off-chain no cuenta los votos

Antes lo hacía. `getDispute` devolvía una resolución derivada de las revelaciones
que un nodo había visto, y eso era erróneo de una forma que vale la pena entender, porque
es un error que parece una ayuda.

**Dos recuentos de los mismos votos son un generador de divergencia, no una segunda
opinión.** La cadena vuelve a arbitrar bajo reglas distintas, así que puede llegar a una
respuesta diferente sobre la misma disputa — y cuando lo hace, la interfaz
muestra un desenlace mientras el dinero sigue el otro. La cadena es la
autoridad sobre el escrow, así que la respuesta off-chain no es una segunda opinión:
es una afirmación que el protocolo hace y luego contradice con sus propios
fondos.

Por eso `resolution` lo fija exactamente una cosa: una transacción de ejecución que este
nodo ha observado confirmarse de forma independiente, cuyo desenlace leyó luego de
la cuenta del caso en la cadena.

## `AwaitingChainExecution` es una respuesta real

Cuando llega cada revelación requerida, el caso queda en
`AwaitingChainExecution`. Ese estado dice que la capa off-chain ha terminado
su trabajo y que el escrow aún no se ha movido. No es «resuelto pendiente de
ejecución» — esa formulación reclamaría un desenlace que el nodo no tiene derecho
a nombrar.

Un nodo que vio aterrizar una transacción pero no pudo leer lo que decidió
**permanece** en `AwaitingChainExecution` y registra la firma que
observó. Algo ocurrió en la cadena y este nodo aún no sabe qué;
decirlo es la respuesta honesta, e inventar un veredicto para llenar el vacío es
exactamente el fallo que esta regla elimina.

## El acuerdo entre las partes no es una excepción

Ambas partes pueden acordar un acuerdo mutuo, y la capa off-chain
verifica ambas firmas directamente. Registra ese acuerdo en cuanto lo
tiene — eso es un hecho real sobre el caso, y ocultarlo escondería
a las partes su propia decisión.

Pero registrar un acuerdo no es registrar una resolución. Hasta que el escrow
no se haya movido de verdad, el caso está en `AwaitingChainExecution` como cualquier otro.

Este es fácil de equivocar, porque a diferencia de un fallo no hay
cómputo que dos nodos pudieran realizar de forma distinta — el acuerdo simplemente *es*
las dos firmas. Aun así tiene que esperar, por dos razones:

- **Las firmas no mueven dinero.** Un caso marcado `MutualSettlement` mientras
  los fondos siguen bloqueados les dice a ambas partes que la disputa terminó y se pagó cuando
  ninguna de las dos cosas es cierta.
- **La cadena ejecuta según sus propios plazos.** Sigue siendo libre de ejecutar un
  desenlace arbitrado sobre un caso cuyas partes acordaron en privado y nunca lo
  transmitieron — volviendo a poner las dos capas en contradicción sobre una sola
  disputa, que es lo que toda esta regla existe para evitar.

## Qué debe mostrar un cliente

| El nodo dice | Mostrar |
| --- | --- |
| `resolution: null`, estado `AwaitingChainExecution` | El caso está decidido o acordado; el escrow aún no se ha movido |
| `resolution` fijado, con una firma de ejecución | El desenlace, y la transacción de la que provino |
| Revelaciones recopiladas, sin cambio de estado | Reunión de evidencia; no existe desenlace que mostrar |

No derives un desenlace de las revelaciones en una respuesta de `getDispute`. Están
ahí para que cualquiera pueda auditar qué se le dio a la cadena, no para que un cliente
llegue a su propio veredicto — un cliente que las cuenta ha reintroducido exactamente
la divergencia que el nodo dejó de producir.

Consulta OFS-2400 §16.2 y §17 para el enunciado normativo.
