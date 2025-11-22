export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Study Assistant",
    description:
      "AI-powered study assistant for students helping with lecture transcription, study materials, and test preparation.",
    url: "https://studyassistant.app",
    logo: "https://studyassistant.app/logo.png",
    sameAs: [
      "https://twitter.com/studyassistant",
      "https://github.com/studyassistant",
      "https://linkedin.com/company/studyassistant",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "info@studyassistant.app",
      contactType: "Customer Support",
      availableLanguage: ["English"],
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Study Assistant",
    url: "https://studyassistant.app",
    description:
      "Free AI-powered study assistant for students. Automatic lecture transcription, study material processing, and test question generation.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://studyassistant.app/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Study Assistant",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "500",
      bestRating: "5",
      worstRating: "1",
    },
    description:
      "AI-powered study assistant that helps students with automatic lecture transcription, intelligent study material processing, and test question generation.",
    featureList: [
      "Automatic lecture recording and transcription",
      "AI-powered study material processing",
      "Test and quiz question generation",
      "Study guide creation",
      "Exam preparation tools",
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Study Assistant?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Study Assistant is a free AI-powered tool that helps students study more effectively through automatic lecture transcription, intelligent study material processing, and test question generation.",
        },
      },
      {
        "@type": "Question",
        name: "How does the lecture transcription work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can record lectures in real-time using your microphone. Our AI automatically transcribes the speech to text and creates a clear, editable transcript.",
        },
      },
      {
        "@type": "Question",
        name: "Is Study Assistant free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, Study Assistant is completely free to use. You can create an account and start using all features immediately without a credit card.",
        },
      },
      {
        "@type": "Question",
        name: "What file formats does Study Assistant support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Study Assistant supports PDF and Word documents for study material processing. You can upload these files and our AI will analyze them to create study guides and test questions.",
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
        name: "Home",
        item: "https://studyassistant.app",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Features",
        item: "https://studyassistant.app/#funkcie",
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
    </>
  );
}
