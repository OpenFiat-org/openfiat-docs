---
title: Preguntas frecuentes
---

# Preguntas frecuentes

**¿Es OpenFiat una blockchain?**
No. OpenFiat es un protocolo de coordinación entre pares construido sobre Solana,
que se encarga de la liquidación.

**¿Necesita mi nodo un daemon IPFS aparte?**
No. Un nodo sirve el contenido del protocolo por sí mismo, sobre su propia identidad libp2p, y
está activado por defecto — `--ipfs-api-url` y un daemon Kubo ya no son la forma en que
eso funciona. Consulta [servicio de contenido](../node-operators/content-serving).

**¿Tengo que listar cada peer con el que mi nodo debería hablar?**
No. `--entrypoint` hace la primera conexión; después un nodo aprende peers
que nunca se le dieron y anuncia las direcciones en las que es alcanzable. Consulta
[descubrimiento de peers](../node-operators/peer-discovery).

**¿Quién gestiona OpenFiat?**
AllenHark lidera el desarrollo inicial y financia el crecimiento temprano, con el
objetivo explícito a largo plazo de una descentralización progresiva — consulta el
[Prefacio](../whitepaper) y el Capítulo 24 (Gobernanza y Evolución del Protocolo).

**¿Bajo qué licencia está el código?**
Apache License 2.0, en cada repositorio de
[OpenFiat-org](https://github.com/OpenFiat-org).

**¿Dónde reporto un problema de seguridad?**
Consulta `SECURITY.md` en el repositorio correspondiente — no abras un issue público.
