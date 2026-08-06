---
title: واجهة برمجة التطبيقات (API)
sidebar_position: 1
---

# واجهة برمجة التطبيقات (API)

تكشف كل عقدة OpenFiat نقطة نهاية JSON-RPC 2.0 واحدة مصمَّمة مباشرةً على
غرار واجهة JSON-RPC الخاصة بـ Solana — أسماء طرق بصيغة camelCase مثل
`getX`/`sendX` عبر نقطة نهاية POST واحدة، بدلًا من هرمية موارد REST.
تنفّذها الحزمتان `rpc` و`api` في
[`openfiat-core`](https://github.com/OpenFiat-org/openfiat-core).

## نقطة النهاية

```
POST /rpc
Content-Type: application/json
```

كل طلب هو مظروف JSON-RPC 2.0 قياسي:

```json
{ "jsonrpc": "2.0", "id": 1, "method": "getAdvertisement", "params": { "id": "ad-1" } }
```

وكل استجابة هي إما `result` أو `error`، لا كلاهما أبدًا:

```json
{ "jsonrpc": "2.0", "id": 1, "result": { "id": "ad-1", "status": "Active", "..." : "..." } }
```

عقدة devnet العامة على `https://openfiat.allenhark.com` — وينشر المضيف
نفسه أيضًا multiaddr نقطة دخول لـ*العُقد*، وهو عنوان مختلف لمهمة مختلفة
(انظر
[getting started](https://github.com/OpenFiat-org/openfiat-core/blob/main/docs/getting-started.md)).
أي عقدة تشغّلها بنفسك تقدّم الواجهة نفسها على `:7080`.

## المفاتيح ومعرّفات الأقران والتواقيع كلها base58

كل مفتاح عام ومعرّف قرين وتوقيع ومعرّف حدث هو سلسلة base58:

```json
{
  "service_id": "node-ALLENLMtV1zEAHT3xpVryqcbdPCB8c9JhM1Jdbe5XHg5",
  "provider": "12D3KooWK9hQ7TwbfvFiaAxUbRFCkdhS7iEpAJDnewNL1anyREQ1",
  "provider_public_key": "ALLENLMtV1zEAHT3xpVryqcbdPCB8c9JhM1Jdbe5XHg5"
}
```

كانت حتى وقت قريب مصفوفات أعداد صحيحة. إن رأيت
`"provider_public_key": [192, 74, 15, ...]`، فأنت تتحدث مع عقدة سابقة
للتغيير — ولا شيء في تلك الاستجابة يميّز مفتاحًا عامًا منشورًا عن مفتاح
خاص مسرَّب، لأن سرّ Ed25519 هو أيضًا اثنان وثلاثون بايتًا. ذلك الالتباس
هو سبب التغيير. صيغة base58 هي أيضًا الوحيدة القابلة للاستخدام:
`12D3KooW…` هو ما يأخذه `--entrypoint` وما يمكن البحث عنه في سجل.

**هذا ليس مجرد تغيير عرض.** فحمولة `sendX` موقَّعة على JSON بنيتها
الداخلية، لذا فإن عميلًا يكتب مفتاحًا في حمولة كمصفوفة يُنتج نسخةً لا
تعيد العقدة إنتاجها. عندها يفشل التحقق من التوقيع — وهو ما يظهر كتغيير
مرفوض، لا كخطأ تحليل. استخدم [SDK](../sdks) ويُعالَج هذا لك؛ وإن صنعت
صيغة السلك يدويًا، فرمِّز المعرّفات كـ base58.

حقول البايت التي **ليست** معرّفات تبقى مصفوفات. فقيمة `commitment`
لصوت نزاع و`secret` كشفه هما قيمتان معتِمتان من اثنين وثلاثين بايتًا، لا
هويّتان، وتُرسَلان كمصفوفات. التمييز بحسب ما *هو* الحقل، لا بحسب طوله.

## تسمية الطرق

تبدأ طرق القراءة بـ `get` ولا تغيّر الحالة أبدًا:

```json
{ "method": "getReservation", "params": { "id": "res-1" } }
{ "method": "getReservations", "params": {} }
```

طريقة `getMyX` تظل قراءةً، لكنها تجيب فقط عن المحفظة التي يُثبت المتصل
حيازتها — انظر [قراءات إثبات المحفظة](./wallet-proof-reads.md).

تبدأ التغييرات بـ `send` وتأخذ حقلًا واحدًا — `data`، حمولة سلك مرمَّزة
بـ base64 و**موقَّعة مسبقًا** أنتجتها محفظة المتصل محليًا. يعكس هذا
`sendTransaction` في Solana: العقدة لا تُنشئ ولا توقّع شيئًا نيابةً عن
المتصل قط، بل تفكّ ترميز الحمولة فقط وتطبّقها عبر مسار التحقق من
التوقيع نفسه الذي يمرّ عبره حدث مستلَم عبر gossip.

```json
{ "method": "sendReservationRequest", "params": { "data": "<base64 wire bytes>" } }
```

يبني `Client` المطبوع لكل [SDK](../sdks) تلك الحمولة ويوقّعها لك — إنه
نقطة التكامل الموصى بها بدلًا من إنشاء صيغة السلك يدويًا.

## فئات الطرق

| المجال | طرق كمثال |
| --- | --- |
| الإعلانات | `getAdvertisement`, `getAdvertisements`, `sendAdvertisementCreate`, `sendAdvertisementPriceUpdate`, `sendAdvertisementDisable` |
| الحجوزات | `getReservation`, `getReservations`, `getMyReservations`, `sendReservationRequest` |
| التسوية | `getSettlement`, `getSettlements`, `getMySettlements`, `sendSettlementInitiate`, `sendPaymentSubmitted`, `sendSettlementApproved` |
| التداول (ضمّ للقراءة فقط) | `getTrade`, `getTrades` |
| النزاعات | `getDispute`, `getDisputes`, `getMyDisputes`, `sendDisputeOpen`, `sendArbitratorJoin`, `sendVoteCommit`, `sendVoteReveal` |
| إثباتات المحفظة | `getWalletChallenge`, `getCounterpartiesChallenge`, `getCounterparties`, `getProviderEarningsChallenge` |
| الحجم | `getSettledVolume` |
| المرفقات والمحتوى | `getSettlementAttachments`, `getHeldContent`, `sendAttachmentPublish` |
| الهوية | `getIdentityClaim`, `getIdentityClaimsByWallet`, `sendClaimPublish` |
| السمعة (للقراءة فقط) | `getReputation` |
| الحوكمة | `getProposal`, `getProposals`, `sendProposalCreate`, `sendVoteCast` |
| مزوّدو الخدمة | `getProvider`, `getProviders`, `sendProviderRegister`, `sendProviderHealthUpdate`, `getProviderEarnings`, `sendProviderWithdraw` |
| الإشعارات | `getSubscription`, `getNotificationDispatch`, `sendSubscriptionUpdate`, `sendDeliveryReport` |
| الأوراكل | `getOracleRecord`, `getExchangeRate`, `getMedianExchangeRate`, `sendOraclePublish` |
| استخبارات المخاطر | `getWalletScreening`, `sendRiskPublish` |
| المكافآت | `getRewardObservations` |
| اللقطات | `getLatestSnapshot`, `getSnapshots`, `getCheckpointSlot`, `sendSnapshotAnnounce` |
| الجلسات | `getSession`, `sendSessionEstablish`, `sendSessionRenew`, `sendSessionRevoke`, `sendSessionMigrate` |
| جسر السلسلة (Solana، OFS-4300) | `getChainStatus`, `getLatestBlockhash`, `sendTransaction` |
| العقدة | `getVersion`, `getHealth`, `getPeers` |

## قراءات لا تسمّي الأطراف

يعيد `getSettlement(s)` و`getReservation(s)` و`getDispute(s)` سجلات
أُزيلت منها هوية الأطراف. هذا تغيير متعمَّد بدافع الأمن لا سهوٌ، وله
صفحة خاصة به: [ما تعيده قراءة عامة](./trade-privacy.md). يقرأ طرفٌ
سجلاته كاملةً عبر [قراءات إثبات المحفظة](./wallet-proof-reads.md).

## تُحسم النزاعات على السلسلة، لا عبر العقدة التي تجيبك

تحمل استجابة `getDispute` الكشوف التي جمعتها عقدة، و**لا** تحمل نتيجةً
مشتقةً منها. لا تظهر نتيجة إلا بعد أن ترصد هذه العقدة معاملة التنفيذ
مؤكَّدةً وتقرأ ما قررته — انظر
[كيف يُحسم النزاع](./dispute-resolution.md). فعميل يحصي الكشوف بنفسه قد
أعاد بالضبط إدخال التباعد الذي توقفت العقدة عن إنتاجه.

## طريقتا سعر صرف، وأيّهما تختار

يعيد `getMedianExchangeRate` رقمًا مجردًا أو `null`، وهو الشكل الصحيح حين
تريد سعرًا أو لا شيء فحسب.

يأخذ `getExchangeRate` نفس `{ base, quote }` ويجيب بحالة موسومة بدلًا من
ذلك، لأن `null` يطوي حقيقتين مختلفتين:

```json
{ "status": "current", "rate": 129.5, "expiresAt": 1753800000000 }
{ "status": "stale" }
{ "status": "noData" }
```

التمييز ليس أكاديميًا. **Stale** تعني أن مزوّدًا ينشر هذا الزوج فعلًا
وأن كل سجل قد انتهت صلاحيته (OFS-7000 §12: البيانات المنتهية ليست بيانات
حالية، مهما قرُب انقضاؤها) — من المرجح أن يعود المصدر، فالانتظار معقول.
**NoData** تعني أن لا أحد يسعّر هذا الممر إطلاقًا والانتظار بلا جدوى.
لا أحدهما رقم، وعلى المتصل ألا يعرض أيًا منهما كرقم.

اختر `getExchangeRate` ما لم يكن لديك سبب لغير ذلك. `getMedianExchangeRate`
يبقى لأن العملاء يعتمدون عليه.

## معرّفات الخدمة

تسجَّل عقدة تحت `node-<مفتاحها العام بصيغة base58>`، ويسجَّل مزوّد لقطات
تحت `snapshot-<المفتاح نفسه>` — البادئة هي ما يتيح لعقدة واحدة أن تحمل
عدة سجلات في السجلّ دون تصادمها.

المعرّف مشتقّ لا عشوائي كي تُحدِّث عقدة تُعاد تشغيلها سجلها القائم بدلًا
من ترك قيد ميت خلفها. اشتقاقه من *كامل* المفتاح مهم: استخدم مخطط سابق
البايتات الثمانية الأولى من معرّف القرين بصيغة hex، وهو ما يبدو ست عشرة
خانة هوية لكنه خانتان، إذ يبدأ كل معرّف قرين Ed25519 بالديباجة السداسية
البايت نفسها. تصادمت عقدتان خلال بضع مئات من عمليات التسجيل، وأزاح ثاني
المسجَّلين أوّلهما.

## ماذا تعرف عقدة عن الشبكة

يبلّغ `getPeers` عن الأقران الذين اكتشفتهم هذه العقدة، والعناوين التي
تعلنها عن نفسها، و`self_peer_id` الخاص بها بصيغة `12D3Koo…` التي تدخل
في `--entrypoint`. انظر [اكتشاف الأقران](../node-operators/peer-discovery.md)
لرؤية المشغّل لذلك.

## الأخطاء

رموز أخطاء JSON-RPC 2.0 القياسية (`-32700` خطأ تحليل، `-32601` طريقة غير
موجودة، `-32602` معاملات غير صالحة، `-32603` خطأ داخلي) تغطي إخفاقات
مستوى النقل. كل إخفاق على مستوى المجال — سيولة غير كافية، حدث مكرَّر،
موقِّع غير مصرَّح له — يعود كخطأ تطبيق واحد `-32000`، مع الرمز العددي
واسم البروتوكول الرمزي (من
[OFS-8000](https://github.com/OpenFiat-org/openfiat-specs)) في `data`:

```json
{ "error": { "code": -32000, "message": "INSUFFICIENT_AVAILABLE_LIQUIDITY", "data": { "ofsErrorCode": 4004, "ofsErrorName": "INSUFFICIENT_AVAILABLE_LIQUIDITY" } } }
```

## الاشتراكات

```
GET /ws
```

يبثّ كل تغيير ناجح فور حدوثه — `{"method": "sendX", "result": ...}` — كي يتمكن عميل من التفاعل مع نشاط السوق دون استقصاء. رشِّح على جانب العميل بالطرق التي تهمّك.

## تُوسَم اللقطات بـ slot، لا بارتفاع

يعيد `getCheckpointSlot` الـ slot الخاص بـ Solana الذي كانت حالة آخر
لقطة مستوردة حاليةً بالنسبة إليه، أو `null` على عقدة لم تستورد أيًا.

كان `getCheckpointHeight`، وإعادة التسمية ليست تجميلية. كانت القيمة
القديمة *عدّ العقدة المنتِجة الخاص لأحداث gossip*، وهو لكل منتِج: عقدتان
تحملان حالةً متطابقة تبلّغان بأرقام مختلفة، وعقدة انضمّت الأسبوع الماضي
تبلّغ برقم أدنى من عقدة تعمل منذ التكوين. مقارنة رقمَي منتِجَين لم تقارن
شيئًا.

الـ slot هو الساعة الوحيدة التي يتشاركها كل مشارك بالفعل. كما يجعل
الادعاء **قابلًا للفحص** — تستطيع عقدة مقارنة slot معلَن برؤيتها الخاصة
للسلسلة ورفض واحد من مستقبل غير معقول، وهو مستحيل ضد رقم لا يراه إلا
المعلِن.

**ما يؤكّده الـ slot أضيق مما يبدو.** فهو يقول *متى* التُقطت الحالة، لا
*ماذا* تحتوي: عقدتان تأخذان لقطة عند الـ slot نفسه قد تحملان حالة gossip
مختلفة قليلًا، لأن الانتشار ليس فوريًا. عامِله كمرساة حداثة، لا كبرهان
على أن لقطةً تحتوي أخرى — الشيء نفسه الذي تعنيه به لقطات Solana ذاتها.

عقدة لم ترصد slot قط لا تنتج لقطات وتقول ذلك. وليس ذلك اشتراطًا لتشغيل
اتصال RPC: عقدة gossip فقط تتعلّم الـ slots عبر جسر السلسلة.

## الحجم المسوَّى، ولماذا هو لكل أصل

يجيب `getSettledVolume` بصفٍ واحد لكل أصل، لا بإجمالي أبدًا:

```json
{
  "assets": [
    { "asset_mint": "2bHPi…RRU", "asset_symbol": "USDC", "decimals": 6,
      "base_units": 4500000, "settlements": 12 },
    { "asset_mint": "So111…112", "asset_symbol": "wSOL", "decimals": 9,
      "base_units": 2000000000, "settlements": 3 }
  ],
  "unattributed_settlements": 1,
  "settlements_known": 16,
  "scope": "settlements this node has replicated and observed confirmed"
}
```

أربعة أمور يجب على العميل ألا يفعلها بهذا:

**لا تجمع عبر الأصول.** فهي رموز مختلفة بمقاييس مختلفة؛ رقم موحَّد يضيف
SOL إلى USDC ولا يعني شيئًا.

**لا تخمّن `decimals`.** فهي `null`، إلى جانب `asset_symbol` بقيمة
`null`، حين لا يملك هذا العقدة اسمًا لذلك الـ mint. اعرض العنوان
والوحدات الأساسية الخام. افتراض `6` هو تحديدًا كيف يخرج wSOL — الذي له
تسع — أكبر بألف مرة.

**لا تُخفِ `unattributed_settlements`.** فهي تسويات مؤكَّدة حقيقية حُذف
إعلانها منذ ذلك الحين، فأصلها غير قابل للاسترداد. حذفها يجعل الإجماليات
تبدو كاملةً بينما تنقص بهذا المقدار.

**لا تُسقط `scope`.** فهي تقول إن هذه هي التسويات التي كرّرتها *هذه
العقدة* وأكّدتها — لا تاريخ الشبكة كله. رقم حجم يُعرَض بلا نطاقه يُقرأ
كإجمالي عالمي. `settlements_known` إلى جانب الصفوف المعدودة يجعل الباقي
يُقرأ كصفقات جارية لا كتناقض.

## المرجع التفاعلي

**[تصفّح كل طريقة →](pathname:///api/reference.html)**

مستند [OpenRPC](https://open-rpc.org) 1.2.6 (مكافئ JSON-RPC لمواصفة
OpenAPI/Swagger) — [`/api/openrpc.json`](pathname:///api/openrpc.json) —
إضافةً إلى صفحة تفاعلية قائمة بذاتها لتصفّح كل طريقة. تُولَّد *قائمة*
الطرق مباشرةً من جدول الإرسال الحي الخاص بـ `openfiat-rpc`
(`cargo run -p openfiat-api --example dump_openrpc`)، لذا لا يمكن أن
تنحرف إلى طريقة لا تشغّلها عقدة حقيقية؛ وتُنشر هنا كلقطة ثابتة إذ ليس
لموقع الوثائق هذا عقدة خاصة به لتقديمها حيًّا. وجّه لوحة «Try it» في
صفحة المرجع إلى عقدة تشغّلها بنفسك (الافتراضي `http://localhost:7080`)
لاستدعاء طريقة فعلًا.

**المخططات** لكل طريقة في ذلك المستند هي تقريب مبسَّط متعمَّد قائم على
اصطلاحات — كل `getX(id)` يأخذ `{id}`، وكل `sendX` يأخذ `{data}` — بدلًا
من JSON Schema مشتق من أنواع Rust الملموسة لكل طريقة. وحيث تنحرف طريقة
عن تلك الاصطلاحات، فهذا الموقع هو الشكل المرجعي: [قراءات إثبات المحفظة](./wallet-proof-reads.md)
و`getExchangeRate` و`getPeers` تأخذ جميعها معاملات لا يصفها الاصطلاح.

كما تقدّم عقدة قيد التشغيل المرجع نفسه حيًّا ومن الأصل نفسه مع `/rpc`
الخاص بها: `GET /openrpc.json` و`GET /docs`. ويكشف `GET /metrics` عدّادات
طلبات بصيغة Prometheus للمشغّلين.
