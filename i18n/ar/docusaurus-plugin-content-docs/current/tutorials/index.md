---
title: الدروس التعليمية
---

# الدروس التعليمية

كل دليل أدناه مثال [SDK](../sdks) حقيقي قابل للتشغيل — مختبَر في CI ضد
عقدة حية، لا مجرد نثر. شغّل عقدة محلية أولًا:

```bash
git clone git@github.com:OpenFiat-org/openfiat-core.git
cd openfiat-core
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

- **[ابنِ روبوت تداول](trading-bot)** — انشر إعلانًا، افتح حجزًا
  عليه.
- **[سجّل مزوّد إشعارات](notification-provider)** — سجّل لدى سجلّ
  الخدمات، أبلغ عن تسليم.
- **[سجّل مزوّد أوراكل](oracle-provider)** — سجّل لدى سجلّ الخدمات،
  انشر سعر صرف موقَّعًا.
