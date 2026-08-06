---
title: SDK
---

# SDK

Официальные SDK поддерживаются в едином монорепозитории,
[openfiat-sdks](https://github.com/OpenFiat-org/openfiat-sdks). Оба реальны,
протестированы против живого узла [`openfiat-core`](https://github.com/OpenFiat-org/openfiat-core)
в CI (не только проверка типов) и покрывают всю [поверхность RPC](../api):
объявления, резервирования, расчёты, сделки, споры, идентичность, управление,
поставщиков услуг, уведомления, оракулы, риск, снапшоты, сессии и
[мост цепочки Solana](https://github.com/OpenFiat-org/openfiat-specs/blob/main/Whitepaper/Specifications/OFS-4300%20-%20OpenFiat%20Chain%20Bridge%20Protocol%20(OCBP).md).

- **[Rust →](rust)** — `openfiat-sdk` в каталоге `rust/` монорепозитория.
- **[TypeScript →](typescript)** — `@openfiat/sdk` в `typescript/`.

Каждый SDK разделяет одну форму: `Client`/`ClientConfig` для общения с
JSON-RPC-поверхностью узла, типизированные методы `getX`/`sendX` по доменам (один
модуль на домен — см. собственную раскладку модулей каждого SDK), и примитив
подписи, который никогда не покидает ваш собственный процесс — узел лишь получает
уже подписанную полезную нагрузку, ровно как `sendTransaction` в Solana.

## Пока не готовы

У Python, Go, Swift, Kotlin и C# есть каркас в монорепозитории (`python/`, `go/`,
`swift/`, `kotlin/`, `csharp/`), но пока нет реальной реализации — отслеживается в
`ROADMAP.md` монорепозитория. Сегодня используйте Rust или TypeScript; вклады,
расширяющие один из остальных, приветствуются.
