---
title: Cartera
---

# Cartera

Hay una vista de cartera en la aplicación web de OpenFiat,
[openfiat-app](https://github.com/OpenFiat-org/openfiat-app) (`/wallet`), y
todavía renderiza datos de demostración — la app se está pasando a datos en vivo una
ruta a la vez, y esta no es una de las rutas que ha migrado.

Una cartera independiente multiplataforma (Android, iOS, Linux, macOS, Windows, Web)
sigue aplazada. El marcador de posición para ella en `openfiat-apps` nunca se
armó, y ese repositorio ya no está en desarrollo activo.

Hasta entonces, un nodo nunca guarda ni firma nada por ti: cada mutación es una
carga que tu propio keypair firma localmente y envía — consulta
[nomenclatura de métodos](../api) y cualquiera de los [SDK](../sdks) para la primitiva de firma.
