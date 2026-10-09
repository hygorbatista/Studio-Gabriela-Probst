export const site = {
  name: "Gabriela Probst",
  whatsappNumber: "5548998402796",
  phoneDisplay: "(48) 99840-2796",
  // "Vi o seu site" mostra para a Gabriela, na própria conversa, que a cliente veio do site.
  whatsappMessage: "Olá, Gabriela! Vi o seu site e gostaria de agendar um horário.",
  instagramUrl: "https://www.instagram.com/gabyprobst.nails/",
  instagramHandle: "@gabyprobst.nails",
  hours: "Segunda a sexta. Sábado a combinar.",
  // Horário de referência: ela é flexível e combina com a cliente.
  opens: "08:00",
  closes: "19:00",
  address: "Centro Comercial Ventura, R. Nossa Sra. dos Navegantes, Serraria, São José - SC, 88115-400",
  street: "R. Nossa Sra. dos Navegantes",
  building: "Centro Comercial Ventura",
  neighborhood: "Serraria",
  city: "São José",
  state: "SC",
  postalCode: "88115-400",
} as const;

export function whatsappLink(message: string) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function bookingLink(serviceName: string) {
  return whatsappLink(`Olá, Gabriela! Vi o seu site e gostaria de agendar: ${serviceName}.`);
}

export const whatsappUrl = whatsappLink(site.whatsappMessage);

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`;

export type Photo = { src: string; alt: string; width: number; height: number };

function photo(file: string, alt: string, width = 1200, height = 1600): Photo {
  return { src: `/images/${file}`, alt, width, height };
}

const photos = {
  red: photo("foto-unha-7.jpeg", "Unhas quadradas vermelhas com acabamento brilhante"),
  nude: photo("modelo-unha-3.jpeg", "Unhas amendoadas em tom nude rosado"),
  pink: photo("modelo-unha-1.jpeg", "Unhas amendoadas em rosa pink brilhante"),
  milky: photo("modelo-unha-2.jpeg", "Unhas curtas em tom leitoso", 1600, 1600),
  pinkFrench: photo("modelo-unha-5.jpeg", "Francesinha rosa pink em unhas amendoadas"),
  blueFrench: photo("modelo-unha-4.jpeg", "Francesinha azul clara com detalhes dourados"),
  pedicure: photo("foto-unha-pes-1.jpeg", "Pedicure em tom leitoso", 828, 1472),
  lightPink: photo("foto-unha-6.jpeg", "Unhas amendoadas em rosa claro brilhante"),
  pinkClose: photo("modelo-unha-1.2.jpeg", "Unhas amendoadas rosa pink de perto"),
  gabriela: photo("foto_gabriela.jpeg", "Gabriela Probst no studio", 1086, 1448),
};

// Ordem em colunas: o painel k do topo mostra os itens k, k+3 e k+6.
export const heroPhotos: Photo[] = [
  photos.red,
  photos.nude,
  photos.pink,
  photos.milky,
  photos.blueFrench,
  photos.lightPink,
  photos.pinkFrench,
  photos.pedicure,
  photos.pinkClose,
];

export const servicesPhoto: Photo = photos.red;

export const aboutPhoto: Photo = photos.gabriela;

export const gallery: Photo[] = [
  photos.milky,
  photos.pinkFrench,
  photos.blueFrench,
  photos.pedicure,
  photos.lightPink,
  photos.pinkClose,
];

export const pillars = [
  {
    title: "Acabamento",
    text: "Cutilagem precisa e acabamento limpo, a assinatura do trabalho.",
  },
  {
    title: "Naturalidade",
    text: "Unhas bonitas que parecem suas, sem exagero.",
  },
  {
    title: "Cuidado",
    text: "Um atendimento por vez, com calma, para você sair se sentindo realizada, linda e cuidada.",
  },
];

export const training = [
  { year: "2020", title: "Curso de manicure tradicional" },
  { year: "2021", title: "Curso de nail designer" },
  { year: "2024", title: "Especialização em nail designer e decoração" },
];

// Só respostas confirmadas pela Gabriela (docs/01). As novas vêm do docs/09-questionario-faq.md.
export const faq = [
  {
    question: "Como faço para agendar?",
    answer: `Pelo WhatsApp ${site.phoneDisplay}. Você escolhe o serviço e combina o melhor dia e horário.`,
  },
  {
    question: "Os valores mudam conforme o tamanho ou a decoração?",
    answer:
      "Não. Os valores são fixos: não mudam por tamanho, comprimento ou decoração.",
  },
  {
    question: "Qual é o horário de atendimento?",
    answer:
      "Segunda a sexta, com horário flexível para combinar com você. Sábado a combinar.",
  },
  {
    question: "Onde fica o studio? Tem estacionamento?",
    answer: `No ${site.building}, ${site.street}, ${site.neighborhood}, ${site.city} - ${site.state}. O local tem estacionamento.`,
  },
  {
    question: "Quais formas de pagamento são aceitas?",
    answer:
      "Pix, dinheiro, débito e crédito. No cartão, o pagamento é por aproximação.",
  },
  {
    question: "E se eu precisar cancelar ou me atrasar?",
    answer:
      "Cancelamentos são feitos com 24 horas de antecedência. A tolerância de atraso é de 15 minutos.",
  },
  {
    question: "Você atende a domicílio?",
    answer: "Não. O atendimento é feito só no studio, uma cliente por vez.",
  },
];
