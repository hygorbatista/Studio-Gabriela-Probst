import Image from "next/image";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { InstagramIcon, MapPinIcon, WhatsAppIcon } from "@/components/icons";
import { MobileMenu } from "@/components/mobile-menu";
import { StructuredData } from "@/components/structured-data";
import { formatDuration, formatPrice } from "@/lib/format";
import { faqJsonLd } from "@/lib/seo";
import { getActiveServices, groupByCategory } from "@/lib/services";
import {
  ClipReveal,
  DrawLine,
  HeroFade,
  HeroParallax,
  LineReveal,
  Reveal,
  ScrollProgress,
  StickyHeader,
} from "@/components/motion";
import {
  aboutPhoto,
  bookingLink,
  faq,
  gallery,
  heroPhotos,
  mapsUrl,
  pillars,
  servicesPhoto,
  site,
  training,
  whatsappUrl,
} from "@/lib/site";

const container = "mx-auto w-full max-w-330 px-5 md:px-10 lg:px-16";
const eyebrow = "text-xs font-semibold uppercase tracking-[0.2em]";
const h2 =
  "font-serif text-[30px] leading-[38px] md:text-[44px] md:leading-13";
const section = "py-16 md:py-24";
// No celular não existe hover: o active: dá o retorno visual do toque.
const button =
  "inline-flex h-12 items-center justify-center px-9 text-xs font-semibold uppercase tracking-[0.2em] transition-colors";
const buttonPrimary = `${button} border border-primary bg-primary text-white hover:border-primary-hover hover:bg-primary-hover active:border-primary-hover active:bg-primary-hover`;
const buttonOutlineLight = `${button} border border-white/40 text-white hover:border-white hover:bg-white hover:text-foreground active:bg-white/15`;
const buttonOutlineDark = `${button} border border-foreground text-foreground hover:bg-foreground hover:text-white active:bg-foreground active:text-white`;

const navLinks = [
  { href: "#servicos", label: "Serviços" },
  { href: "#sobre", label: "Sobre" },
  { href: "#trabalhos", label: "Trabalhos" },
  { href: "#duvidas", label: "Dúvidas" },
  { href: "#contato", label: "Contato" },
];

const marqueeItems = [
  "Fibra de vidro",
  "Acabamento impecável",
  "Blindagem",
  "Banho de gel",
  "Resultado natural",
  "Esmaltação em gel",
  "Manicure",
  "Pedicure",
];

function HeaderBar({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`${container} flex items-center justify-between ${compact ? "py-3" : "py-5"}`}
    >
      <a href="#" className="whitespace-nowrap py-1 leading-none">
        <span className="block font-serif text-lg sm:text-xl">{site.name}</span>
        <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
          Nail Studio
        </span>
      </a>
      <div className="flex items-center gap-2 lg:gap-8">
        <nav aria-label="Principal" className="hidden gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center justify-center border border-primary bg-primary px-3 text-xs font-semibold uppercase tracking-widest transition-colors hover:border-primary-hover hover:bg-primary-hover active:bg-primary-hover min-[360px]:px-4 min-[360px]:tracking-[0.15em] lg:px-5 lg:tracking-[0.2em]"
        >
          Agendar
        </a>
        <MobileMenu
          links={navLinks}
          brand={site.name}
          whatsappUrl={whatsappUrl}
          footer={site.hours}
        />
      </div>
    </div>
  );
}

function Marquee() {
  const items = [...marqueeItems, ...marqueeItems];
  return (
    <div
      aria-hidden
      className="overflow-hidden border-y border-white/10 bg-foreground py-6 text-white"
    >
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        {items.map((item, index) => (
          <span
            key={index}
            className="flex items-center gap-8 pr-8 font-serif text-3xl italic text-white/85 md:text-5xl"
          >
            {item}
            <span className="text-base not-italic text-accent">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default async function Home() {
  // Em cache: a página continua estática e é refeita quando o painel altera um serviço.
  const services = await getActiveServices();
  const prices = services.map((service) => service.price);

  return (
    <main className="flex flex-1 flex-col">
      <ScrollProgress />
      <StickyHeader>
        <HeaderBar compact />
      </StickyHeader>

      <section className="relative isolate flex min-h-svh flex-col overflow-hidden bg-foreground text-white">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <HeroParallax className="absolute inset-0 md:grid md:grid-cols-3 md:gap-px">
            <HeroSlideshow photos={heroPhotos} />
          </HeroParallax>
          <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/45 to-black/30" />
          <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/30 to-transparent md:from-black/80 md:via-black/40" />
        </div>

        <header>
          <HeaderBar />
        </header>

        {/* No celular, o pb reserva a altura da barra fixa de contato (h-14 + área segura do iPhone). */}
        <HeroFade
          className={`${container} mt-auto pb-[calc(3.5rem+env(safe-area-inset-bottom)+2rem)] pt-28 md:pb-14 md:pt-32`}
        >
          {/* A linha pequena faz parte do h1: é ela que diz ao Google o que é e onde fica.
              No celular fica curta para caber em uma linha e não empurrar os botões. */}
          <h1 className="max-w-4xl font-serif text-[clamp(2.25rem,11.5vw,2.75rem)] leading-[1.18] tracking-[-0.01em] [text-shadow:0_2px_30px_rgba(0,0,0,0.6)] md:text-[72px] md:leading-20 md:tracking-[-0.02em] lg:text-[88px] lg:leading-24">
            <Reveal delay={0.5} y={16} as="span" className="mb-4 block md:mb-5">
              <span className={`${eyebrow} block font-sans leading-normal text-white/80 text-shadow-none`}>
                <span className="hidden md:inline">Manicure e </span>
                nail designer ·{" "}
                <span className="hidden md:inline">Serraria, </span>
                São José<span className="hidden md:inline"> - SC</span>
              </span>
            </Reveal>{" "}
            <LineReveal immediate delay={0.6}>
              Acabamento impecável.
            </LineReveal>
            <LineReveal immediate delay={0.75}>
              <em className="text-white/90">Resultado natural.</em>
            </LineReveal>
          </h1>
          <Reveal delay={1} y={16}>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/90 [text-shadow:0_1px_16px_rgba(0,0,0,0.7)] md:mt-6 md:text-lg">
              Fibra de vidro, blindagem e gel, com cutilagem precisa e um
              atendimento por vez, sem pressa.
            </p>
          </Reveal>
          <Reveal delay={1.15} y={16}>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row md:mt-8">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonPrimary} gap-3`}
              >
                <WhatsAppIcon className="size-5" />
                Agendar no WhatsApp
              </a>
              <a href="#servicos" className={buttonOutlineLight}>
                Ver serviços e valores
              </a>
            </div>
          </Reveal>
        </HeroFade>

        <ul className="hidden border-t border-white/20 bg-black/55 md:block">
          <li className={`${container} grid grid-cols-3 gap-6 py-5 text-sm`}>
            <span className="text-white/80">
              <span className={`${eyebrow} mb-1 block text-white/50`}>
                Horário
              </span>
              Seg. a sex., horário flexível · sábado com agendamento
            </span>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 transition-colors hover:text-white"
            >
              <span className={`${eyebrow} mb-1 block text-white/50`}>
                Onde
              </span>
              Serraria, São José · com estacionamento
            </a>
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 transition-colors hover:text-white"
            >
              <span className={`${eyebrow} mb-1 block text-white/50`}>
                Instagram
              </span>
              {site.instagramHandle}
            </a>
          </li>
        </ul>
      </section>

      <section className={`${container} py-16 md:py-20`}>
        {/* Título só para leitores de tela e buscadores: mantém a ordem h1 > h2 > h3. */}
        <h2 className="sr-only">O atendimento</h2>
        <ul className="grid gap-12 md:grid-cols-3 md:gap-10">
          {pillars.map((pillar, index) => (
            <li key={pillar.title}>
              <DrawLine className="bg-border" delay={index * 0.15} />
              <Reveal delay={0.1 + index * 0.15} className="pt-6">
                <p className="font-serif text-sm italic text-primary">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 font-serif text-2xl">{pillar.title}</h3>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  {pillar.text}
                </p>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <Marquee />

      <section id="servicos" className={`bg-foreground text-white ${section}`}>
        <div
          className={`${container} grid gap-10 md:gap-14 lg:grid-cols-[5fr_7fr] lg:gap-20`}
        >
          <div>
            <Reveal>
              <p className={`${eyebrow} text-accent`}>Serviços</p>
            </Reveal>
            <h2 className={`mt-3 ${h2}`}>
              <LineReveal>Serviços e valores</LineReveal>
            </h2>
            <Reveal delay={0.15}>
              <p className="mt-5 max-w-md text-base leading-7 text-white/70">
                Manicure, pedicure, alongamento em fibra de vidro, blindagem e
                gel, de R$ {Math.min(...prices)} a R$ {Math.max(...prices)}. Os
                valores são fixos: não mudam por tamanho, comprimento ou
                decoração.
              </p>
            </Reveal>
            <Reveal delay={0.25} className="mt-6 hidden max-w-md lg:block">
              <div className="relative aspect-4/5 w-full mask-[linear-gradient(to_bottom,transparent,black_30%,black_60%,transparent)]">
                <Image
                  src={servicesPhoto.src}
                  alt={servicesPhoto.alt}
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover object-bottom brightness-75"
                />
              </div>
            </Reveal>
          </div>

          <div className="flex flex-col gap-12">
            {groupByCategory(services).map((group) => (
              <div key={group.title}>
                <Reveal>
                  <p className={`${eyebrow} text-white/50`}>{group.title}</p>
                </Reveal>
                <DrawLine className="mt-4 bg-white/15" />
                <ul>
                  {group.items.map((service, index) => (
                    <li key={service.id} className="border-b border-white/15">
                      <Reveal delay={index * 0.06} y={16}>
                        {/* A linha inteira é o link: área de toque grande no celular. */}
                        <a
                          href={bookingLink(service.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Agendar ${service.name}, ${formatPrice(service.price)}, pelo WhatsApp`}
                          className="group flex items-center gap-4 py-5 transition-colors active:bg-white/5 md:py-6"
                        >
                          <div className="flex-1 transition-transform duration-500 group-hover:translate-x-2">
                            <p className="font-serif text-xl md:text-2xl">
                              {service.name}
                            </p>
                            <p className="mt-1 text-sm text-white/60">
                              {formatDuration(
                                service.duration_minutes,
                                service.duration_up_to
                              )}
                            </p>
                          </div>
                          <p className="font-serif text-xl transition-colors duration-500 group-hover:text-accent md:text-2xl">
                            {formatPrice(service.price)}
                          </p>
                          <span className="inline-flex size-11 shrink-0 items-center justify-center border border-white/30 text-xs font-semibold uppercase tracking-[0.2em] transition-colors group-hover:border-primary group-hover:bg-primary group-active:border-primary group-active:bg-primary md:w-auto md:px-4">
                            <WhatsAppIcon className="size-5 md:hidden" />
                            <span className="hidden md:inline">Agendar</span>
                          </span>
                        </a>
                      </Reveal>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="sobre" className={`${container} ${section}`}>
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-20">
          <ClipReveal className="relative aspect-4/5 w-full">
            <Image
              src={aboutPhoto.src}
              alt={aboutPhoto.alt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </ClipReveal>

          <div>
            <Reveal>
              <p className={`${eyebrow} text-primary`}>Sobre</p>
            </Reveal>
            <h2 className={`mt-3 ${h2}`}>
              <LineReveal>Gabriela Probst</LineReveal>
            </h2>
            <Reveal delay={0.15}>
              <p className="mt-6 text-base leading-7 text-muted-foreground">
                Nail designer, com formação desde 2020 e especialização em nail
                design e decoração em 2024. O que as clientes mais elogiam é a
                cutilagem e o acabamento: um resultado natural, que valoriza as
                suas mãos.
              </p>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                No Centro Comercial Ventura, na Serraria, cada cliente é
                atendida por vez, com calma. O local tem estacionamento.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <p className={`${eyebrow} mt-10 text-primary`}>Formação</p>
            </Reveal>
            <ol className="mt-4">
              {training.map((item, index) => (
                <li key={item.year}>
                  <DrawLine className="bg-border" delay={index * 0.12} />
                  <Reveal
                    delay={0.1 + index * 0.12}
                    y={12}
                    className="flex items-baseline gap-6 py-4"
                  >
                    <span className="w-14 shrink-0 font-serif text-xl italic text-primary">
                      {item.year}
                    </span>
                    <span className="text-base">{item.title}</span>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="trabalhos" className={`bg-surface ${section}`}>
        <div className={container}>
          <Reveal>
            <p className={`${eyebrow} text-primary`}>Trabalhos</p>
          </Reveal>
          <h2 className={`mt-3 ${h2}`}>
            <LineReveal>Unhas feitas no studio</LineReveal>
          </h2>
          <ul className="mt-10 columns-2 gap-3 md:columns-3 md:gap-6">
            {gallery.map((photo, index) => (
              <li
                key={photo.src}
                className="group mb-3 break-inside-avoid overflow-hidden md:mb-6"
              >
                <ClipReveal delay={(index % 3) * 0.12}>
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    sizes="(min-width: 768px) 33vw, 50vw"
                    className="h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                </ClipReveal>
              </li>
            ))}
          </ul>
          <Reveal className="mt-12 flex flex-col items-start gap-4 border-t border-border pt-10 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-serif text-2xl">
              Veja mais trabalhos no Instagram.
            </p>
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonOutlineDark} w-full sm:w-auto`}
            >
              {site.instagramHandle}
            </a>
          </Reveal>
        </div>
      </section>

      <section id="duvidas" className={`${container} ${section}`}>
        <StructuredData data={faqJsonLd} />
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-20">
          <div>
            <Reveal>
              <p className={`${eyebrow} text-primary`}>Dúvidas</p>
            </Reveal>
            <h2 className={`mt-3 ${h2}`}>
              <LineReveal>Perguntas frequentes</LineReveal>
            </h2>
          </div>
          <div>
            <DrawLine className="bg-border" />
            <ul>
              {faq.map((item, index) => (
                <li key={item.question} className="border-b border-border">
                  <Reveal delay={index * 0.05} y={12}>
                    <details className="group">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 py-5 font-serif text-xl md:text-2xl [&::-webkit-details-marker]:hidden">
                        {item.question}
                        <span
                          aria-hidden
                          className="shrink-0 font-sans text-2xl leading-none text-primary transition-transform duration-300 group-open:rotate-45"
                        >
                          +
                        </span>
                      </summary>
                      <p className="max-w-2xl pb-6 text-base leading-7 text-muted-foreground">
                        {item.answer}
                      </p>
                    </details>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="contato" className={`bg-primary-deep text-white ${section}`}>
        <div className={container}>
          <Reveal>
            <p className={`${eyebrow} text-white/70`}>Agendamento</p>
          </Reveal>
          <h2 className={`mt-3 max-w-2xl ${h2}`}>
            <LineReveal>Reserve o seu horário.</LineReveal>
          </h2>
          <Reveal delay={0.15}>
            <p className="mt-5 max-w-md text-base leading-7 text-white/80">
              Chame no WhatsApp, escolha o serviço e combine o melhor dia.
            </p>
          </Reveal>

          <ul className="mt-10 grid gap-px border border-white/20 bg-white/20 md:mt-12 md:grid-cols-3">
            {[
              {
                href: whatsappUrl,
                label: "WhatsApp",
                title: site.phoneDisplay,
                text: site.hours,
              },
              {
                href: site.instagramUrl,
                label: "Instagram",
                title: site.instagramHandle,
                text: "Mais trabalhos e novidades.",
              },
              {
                href: mapsUrl,
                label: "Endereço",
                title: site.building,
                text: `${site.street}, ${site.neighborhood}, ${site.city} - ${site.state}. Com estacionamento.`,
              },
            ].map((card, index) => (
              <li key={card.label} className="bg-primary-deep">
                <Reveal delay={index * 0.12} y={16} className="h-full">
                  <a
                    href={card.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full p-6 transition-colors hover:bg-primary active:bg-primary md:p-8"
                  >
                    <span className={`${eyebrow} text-white/60`}>
                      {card.label}
                    </span>
                    <span className="mt-3 block font-serif text-2xl">
                      {card.title}
                    </span>
                    <span className="mt-3 block text-sm text-white/70">
                      {card.text}
                    </span>
                  </a>
                </Reveal>
              </li>
            ))}
          </ul>

          <Reveal delay={0.2}>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${button} mt-10 w-full gap-3 border border-white bg-white text-primary-deep hover:bg-transparent hover:text-white active:bg-white/85 sm:w-auto`}
            >
              <WhatsAppIcon className="size-5" />
              Agendar no WhatsApp
            </a>
          </Reveal>
        </div>
      </section>

      <footer
        className={`${container} flex flex-col gap-2 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-10 text-sm text-muted-foreground md:flex-row md:justify-between md:gap-10 md:pb-10`}
      >
        <p>{site.name} · Nail designer em São José - SC</p>
        <p>{site.address}</p>
      </footer>

      <nav
        aria-label="Contato rápido"
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-white/15 bg-foreground pb-[env(safe-area-inset-bottom)] text-white md:hidden"
      >
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 flex-1 items-center justify-center gap-2 bg-primary text-xs font-semibold uppercase tracking-[0.12em] transition-colors active:bg-primary-hover"
        >
          <WhatsAppIcon className="size-5 shrink-0" />
          <span>
            Agendar<span className="hidden min-[360px]:inline"> no WhatsApp</span>
          </span>
        </a>
        <a
          href={site.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 w-16 flex-col items-center justify-center gap-1 border-l border-white/15 text-xs text-white/80 transition-colors active:bg-white/10"
        >
          <InstagramIcon className="size-5" />
          Insta
        </a>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 w-16 flex-col items-center justify-center gap-1 border-l border-white/15 text-xs text-white/80 transition-colors active:bg-white/10"
        >
          <MapPinIcon className="size-5" />
          Mapa
        </a>
      </nav>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Agendar pelo WhatsApp"
        className="fixed bottom-8 right-8 z-50 hidden size-15 items-center justify-center rounded-full bg-primary text-white shadow-[0_14px_32px_-8px_rgba(80,16,29,0.6)] ring-1 ring-white/30 transition duration-300 hover:scale-105 hover:bg-primary-hover md:inline-flex"
      >
        <WhatsAppIcon className="size-7" />
      </a>
    </main>
  );
}
