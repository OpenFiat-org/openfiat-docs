---
title: Comerciantes
---

# Comerciantes

Los comerciantes publican anuncios, gestionan reservas y liquidaciones, y
monitorizan analíticas a través de la aplicación web de OpenFiat,
[openfiat-app](https://github.com/OpenFiat-org/openfiat-app) — los perfiles de
comerciante, el asistente de publicación de anuncios y la sala de operaciones viven ahí.

Esa app se está migrando de datos de demostración simulados a datos en vivo una ruta a
la vez, y los flujos de comerciante están entre las rutas que todavía renderizan datos de demo.
Trata lo que ves ahí como la forma prevista y no como tu propia contabilidad.
La superficie del lado del nodo bajo ella — `sendAdvertisementCreate`,
`sendAdvertisementPriceUpdate`, `sendAdvertisementDisable`, y los
métodos de reserva y liquidación — es real hoy y está documentada en la
[referencia de la API](../api).

El andamiaje más antiguo `openfiat-apps/merchant` ya no está en desarrollo
activo; el nuevo trabajo de frontend se concentra en `openfiat-app`.

Esta sección cubrirá la incorporación, las buenas prácticas de anuncios, el manejo de
disputas y la conciliación de liquidaciones a medida que esos flujos pasen a datos en vivo.
