import {
  aboutPhoto,
  faq,
  gallery,
  mapsUrl,
  serviceGroups,
  site,
} from "@/lib/site";

// Sem domínio próprio ainda: na Vercel usa o endereço de produção do projeto.
// Quando houver domínio, basta definir NEXT_PUBLIC_SITE_URL.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const seoTitle = `${site.name} | Manicure e Nail Designer em São José - SC`;

export const seoDescription =
  "Fibra de vidro, blindagem, banho de gel, esmaltação em gel, manicure e pedicure com acabamento impecável e resultado natural. Serraria, São José - SC.";

const absolute = (path: string) => new URL(path, siteUrl).toString();

const prices = serviceGroups.flatMap((group) =>
  group.items.map((item) => item.price)
);

// Dados estruturados (schema.org) que o Google e as IAs leem para entender o negócio.
export const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "NailSalon",
  "@id": `${absolute("/")}#negocio`,
  name: site.name,
  description: seoDescription,
  url: absolute("/"),
  image: [aboutPhoto, ...gallery].map((photo) => absolute(photo.src)),
  telephone: `+${site.whatsappNumber}`,
  address: {
    "@type": "PostalAddress",
    streetAddress: `${site.street}, ${site.building}`,
    addressLocality: site.city,
    addressRegion: site.state,
    postalCode: site.postalCode,
    addressCountry: "BR",
  },
  areaServed: { "@type": "City", name: `${site.city} - ${site.state}` },
  hasMap: mapsUrl,
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: site.opens,
      closes: site.closes,
    },
  ],
  priceRange: `R$ ${Math.min(...prices)} - R$ ${Math.max(...prices)}`,
  currenciesAccepted: "BRL",
  paymentAccepted: "Pix, dinheiro, cartão de débito, cartão de crédito",
  sameAs: [site.instagramUrl],
  founder: {
    "@type": "Person",
    name: site.name,
    jobTitle: "Nail designer",
    image: absolute(aboutPhoto.src),
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Serviços e valores",
    itemListElement: serviceGroups.map((group) => ({
      "@type": "OfferCatalog",
      name: group.title,
      itemListElement: group.items.map((item) => ({
        "@type": "Offer",
        price: item.price.toFixed(2),
        priceCurrency: "BRL",
        itemOffered: { "@type": "Service", name: item.name },
      })),
    })),
  },
};

export const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};
