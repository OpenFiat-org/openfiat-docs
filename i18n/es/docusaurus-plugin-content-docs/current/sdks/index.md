---
title: SDKs
---

# SDKs

Los SDK oficiales se mantienen en un único monorepo,
[openfiat-sdks](https://github.com/OpenFiat-org/openfiat-sdks). Ambos son
reales, probados contra un nodo [`openfiat-core`](https://github.com/OpenFiat-org/openfiat-core)
en vivo en CI (no solo con comprobación de tipos) y cubren toda la [superficie RPC](../api):
anuncios, reservas, liquidación, operación, disputas, identidad,
gobernanza, proveedores de servicio, notificaciones, oráculos, riesgo, snapshots,
sesiones y el [puente de cadena de Solana](https://github.com/OpenFiat-org/openfiat-specs/blob/main/Whitepaper/Specifications/OFS-4300%20-%20OpenFiat%20Chain%20Bridge%20Protocol%20(OCBP).md).

- **[Rust →](rust)** — `openfiat-sdk` en el directorio `rust/` del monorepo.
- **[TypeScript →](typescript)** — `@openfiat/sdk` en `typescript/`.

Cada SDK comparte la misma forma: un `Client`/`ClientConfig` para hablar con
la superficie JSON-RPC de un nodo, métodos tipados `getX`/`sendX` por dominio (un
módulo por dominio — consulta la propia distribución de módulos de cada SDK), y una primitiva de firma
que nunca sale de tu propio proceso — un nodo solo recibe siempre
una carga ya firmada, exactamente como el `sendTransaction` de Solana.

## Aún no listos

Python, Go, Swift, Kotlin y C# tienen andamiaje en el monorepo
(`python/`, `go/`, `swift/`, `kotlin/`, `csharp/`) pero todavía ninguna
implementación real — se rastrea en el `ROADMAP.md` del monorepo. Usa Rust o
TypeScript hoy; se agradecen las contribuciones que amplíen alguno de los demás.
