---
title: حِزم SDK
---

# حِزم SDK

تُصان حزم SDK الرسمية في مستودع أحادي واحد،
[openfiat-sdks](https://github.com/OpenFiat-org/openfiat-sdks). كلتاهما
حقيقية، ومختبَرة ضد عقدة [`openfiat-core`](https://github.com/OpenFiat-org/openfiat-core)
حية في CI (لا مجرد فحص أنواع) وتغطيان كامل [واجهة RPC](../api):
الإعلانات، الحجوزات، التسوية، التداول، النزاعات، الهوية، الحوكمة،
مزوّدي الخدمة، الإشعارات، الأوراكل، المخاطر، اللقطات، الجلسات، و
[جسر سلسلة Solana](https://github.com/OpenFiat-org/openfiat-specs/blob/main/Whitepaper/Specifications/OFS-4300%20-%20OpenFiat%20Chain%20Bridge%20Protocol%20(OCBP).md).

- **[Rust →](rust)** — `openfiat-sdk` في دليل `rust/` بالمستودع.
- **[TypeScript →](typescript)** — `@openfiat/sdk` في `typescript/`.

تشترك كل حزمة SDK في الشكل نفسه: `Client`/`ClientConfig` للتحدث مع واجهة
JSON-RPC لعقدة، وطرق مطبوعة `getX`/`sendX` لكل مجال (وحدة لكل مجال —
انظر تخطيط الوحدات الخاص بأي من الحزمتين)، وبدائية توقيع لا تغادر عمليتك
الخاصة قط — لا تستلم عقدة إلا حمولة موقَّعة مسبقًا، تمامًا كـ
`sendTransaction` في Solana.

## ليست جاهزة بعد

لدى Python وGo وSwift وKotlin وC# سقالة في المستودع (`python/`، `go/`،
`swift/`، `kotlin/`، `csharp/`) لكن دون تنفيذ حقيقي بعد — يُتتبَّع في
`ROADMAP.md` بالمستودع. استخدم Rust أو TypeScript اليوم؛ المساهمات التي
توسّع إحدى الأخرى مرحَّب بها.
