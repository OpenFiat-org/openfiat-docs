---
title: SDK
---

# SDK

आधिकारिक SDK एक ही monorepo,
[openfiat-sdks](https://github.com/OpenFiat-org/openfiat-sdks) में अनुरक्षित हैं।
दोनों असली हैं, CI में एक जीवंत [`openfiat-core`](https://github.com/OpenFiat-org/openfiat-core)
नोड के विरुद्ध परीक्षित (केवल टाइपचेक नहीं) और पूरे [RPC इंटरफ़ेस](../api) को कवर
करते हैं: विज्ञापन, आरक्षण, निपटान, व्यापार, विवाद, पहचान, शासन, सेवा प्रदाता,
सूचनाएँ, ऑरेकल, जोखिम, स्नैपशॉट, सत्र, और [Solana चेन ब्रिज](https://github.com/OpenFiat-org/openfiat-specs/blob/main/Whitepaper/Specifications/OFS-4300%20-%20OpenFiat%20Chain%20Bridge%20Protocol%20(OCBP).md)।

- **[Rust →](rust)** — monorepo की `rust/` निर्देशिका में `openfiat-sdk`।
- **[TypeScript →](typescript)** — `typescript/` में `@openfiat/sdk`।

हर SDK वही आकार साझा करता है: एक नोड के JSON-RPC इंटरफ़ेस से बात करने के लिए एक
`Client`/`ClientConfig`, प्रति डोमेन टाइप्ड `getX`/`sendX` मेथड (प्रति डोमेन एक
मॉड्यूल — किसी भी SDK का अपना मॉड्यूल लेआउट देखें), और एक हस्ताक्षर प्रिमिटिव जो
आपकी अपनी प्रक्रिया से कभी बाहर नहीं जाता — एक नोड केवल कभी एक पहले से हस्ताक्षरित
payload प्राप्त करता है, ठीक Solana के `sendTransaction` की तरह।

## अभी तैयार नहीं

Python, Go, Swift, Kotlin और C# का monorepo में ढाँचा है (`python/`, `go/`,
`swift/`, `kotlin/`, `csharp/`) पर अभी कोई असली कार्यान्वयन नहीं — monorepo के
`ROADMAP.md` में ट्रैक किया गया। आज Rust या TypeScript का उपयोग करें; अन्य में से
किसी एक का विस्तार करने वाले योगदानों का स्वागत है।
