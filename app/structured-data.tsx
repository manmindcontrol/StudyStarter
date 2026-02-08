export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "StudyStarter",
    description:
      "AI aplikácia pre študentov - prepis prednášok, generovanie testových otázok a študijných materiálov. Naučte sa efektívne s umelou inteligenciou.",
    url: "https://studystarter.io",
    logo: "https://studystarter.io/logo.png",
    sameAs: [
      "https://twitter.com/studystarter",
      "https://instagram.com/studystarter",
      "https://facebook.com/studystarter",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "info@studystarter.io",
      contactType: "Customer Support",
      availableLanguage: ["Slovak", "English", "German"],
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "StudyStarter",
    url: "https://studystarter.io",
    description:
      "Ako sa efektívne učiť? StudyStarter je bezplatná AI aplikácia pre študentov. Automatický prepis prednášok, generovanie testových otázok a študijných materiálov.",
    inLanguage: ["sk", "en", "de"],
    potentialAction: {
      "@type": "SearchAction",
      target: "https://studystarter.io/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "StudyStarter",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "500",
      bestRating: "5",
      worstRating: "1",
    },
    description:
      "AI pomôcka pre efektívne učenie. Automatický prepis prednášok, inteligentné spracovanie študijných materiálov a generovanie testových otázok.",
    featureList: [
      "Automatický prepis prednášok v reálnom čase",
      "Generovanie testových otázok z materiálov",
      "AI študijné poznámky",
      "Spracovanie PDF a Word dokumentov",
      "Príprava na skúšky",
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Ako sa efektívne učiť?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Efektívne učenie zahŕňa aktívne opakovanie, testovanie sa a organizáciu materiálov. StudyStarter vám pomôže automaticky vytvárať testové otázky a študijné poznámky z vašich materiálov, čo zefektívni váš proces učenia.",
        },
      },
      {
        "@type": "Question",
        name: "Čo je StudyStarter?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "StudyStarter je bezplatná AI aplikácia, ktorá pomáha študentom efektívnejšie sa učiť. Ponúka automatický prepis prednášok, spracovanie študijných materiálov a generovanie testových otázok.",
        },
      },
      {
        "@type": "Question",
        name: "Ako funguje prepis prednášok?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Môžete nahrávať prednášky v reálnom čase pomocou mikrofónu. Naša AI automaticky prepisuje reč na text a vytvára prehľadný, upraviteľný prepis.",
        },
      },
      {
        "@type": "Question",
        name: "Je StudyStarter zadarmo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Áno, StudyStarter ponúka bezplatný plán s prístupom k základným funkciám. Môžete si vytvoriť účet a začať používať aplikáciu ihneď bez platobnej karty.",
        },
      },
      {
        "@type": "Question",
        name: "Aké formáty súborov StudyStarter podporuje?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "StudyStarter podporuje PDF a Word dokumenty pre spracovanie študijných materiálov. Môžete nahrať tieto súbory a naša AI z nich vytvorí študijné poznámky a testové otázky.",
        },
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Domov",
        item: "https://studystarter.io",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Funkcie",
        item: "https://studystarter.io/#funkcie",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Cenník",
        item: "https://studystarter.io/pricing",
      },
    ],
  };

  // HowTo schema pre lepšie zobrazenie v Google
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Ako sa efektívne učiť so StudyStarter",
    description:
      "Návod ako používať AI na efektívnejšie učenie a prípravu na skúšky",
    step: [
      {
        "@type": "HowToStep",
        name: "Zaregistrujte sa",
        text: "Vytvorte si bezplatný účet na studystarter.io",
      },
      {
        "@type": "HowToStep",
        name: "Nahrajte materiály",
        text: "Nahrajte PDF alebo Word dokumenty, alebo začnite nahrávať prednášku",
      },
      {
        "@type": "HowToStep",
        name: "Nechajte AI pracovať",
        text: "AI spracuje vaše materiály a vytvorí študijné poznámky a testové otázky",
      },
      {
        "@type": "HowToStep",
        name: "Učte sa efektívne",
        text: "Používajte vygenerované testy a poznámky na prípravu na skúšky",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
    </>
  );
}
