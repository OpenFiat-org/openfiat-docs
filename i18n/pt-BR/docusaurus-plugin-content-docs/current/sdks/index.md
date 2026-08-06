---
title: SDKs
---

# SDKs

Os SDKs oficiais são mantidos em um único monorepo,
[openfiat-sdks](https://github.com/OpenFiat-org/openfiat-sdks). Ambos são reais,
testados contra um nó [`openfiat-core`](https://github.com/OpenFiat-org/openfiat-core)
ao vivo no CI (não apenas com checagem de tipos) e cobrem toda a
[superfície RPC](../api): anúncios, reservas, liquidação, negociação, disputas,
identidade, governança, provedores de serviço, notificações, oráculos, risco,
snapshots, sessões e a [ponte de cadeia da Solana](https://github.com/OpenFiat-org/openfiat-specs/blob/main/Whitepaper/Specifications/OFS-4300%20-%20OpenFiat%20Chain%20Bridge%20Protocol%20(OCBP).md).

- **[Rust →](rust)** — `openfiat-sdk` no diretório `rust/` do monorepo.
- **[TypeScript →](typescript)** — `@openfiat/sdk` em `typescript/`.

Cada SDK compartilha a mesma forma: um `Client`/`ClientConfig` para falar com a
superfície JSON-RPC de um nó, métodos tipados `getX`/`sendX` por domínio (um
módulo por domínio — veja a própria distribuição de módulos de cada SDK), e uma
primitiva de assinatura que nunca sai do seu próprio processo — um nó só recebe
uma carga já assinada, exatamente como o `sendTransaction` da Solana.

## Ainda não prontos

Python, Go, Swift, Kotlin e C# têm andaime no monorepo (`python/`, `go/`,
`swift/`, `kotlin/`, `csharp/`) mas ainda nenhuma implementação real —
rastreado no `ROADMAP.md` do monorepo. Use Rust ou TypeScript hoje;
contribuições que estendam algum dos outros são bem-vindas.
