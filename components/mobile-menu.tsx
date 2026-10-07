"use client";

import { useRef } from "react";
import { CloseIcon, MenuIcon, WhatsAppIcon } from "@/components/icons";

type MobileMenuProps = {
  links: { href: string; label: string }[];
  brand: string;
  whatsappUrl: string;
  footer: string;
};

// O <dialog> aberto com showModal() já fecha no Esc/voltar, prende o foco e deixa o resto da página inerte.
export function MobileMenu({ links, brand, whatsappUrl, footer }: MobileMenuProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menu"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
        className="inline-flex size-11 items-center justify-center border border-white/30 text-white transition-colors active:bg-white/10 lg:hidden"
      >
        <MenuIcon className="size-5" />
      </button>

      <dialog
        ref={dialog}
        aria-label="Menu"
        className="m-0 h-dvh max-h-none w-full max-w-none bg-foreground p-0 text-white opacity-100 transition-opacity duration-300 starting:open:opacity-0 lg:hidden"
      >
        <div className="flex h-full flex-col px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:px-10">
          <div className="flex items-center justify-between py-3">
            <p className="leading-none">
              <span className="block font-serif text-lg sm:text-xl">{brand}</span>
              <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                Nail Studio
              </span>
            </p>
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={close}
              className="inline-flex size-11 items-center justify-center border border-white/30 transition-colors active:bg-white/10"
            >
              <CloseIcon className="size-5" />
            </button>
          </div>

          <nav aria-label="Seções" className="mt-10 flex-1">
            <ul>
              {links.map((link, index) => (
                <li key={link.href} className="border-b border-white/15">
                  <a
                    href={link.href}
                    onClick={close}
                    className="flex items-baseline gap-5 py-5 transition-colors active:text-accent"
                  >
                    <span className="font-serif text-sm italic text-accent">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-serif text-4xl">{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            className="inline-flex h-12 items-center justify-center gap-3 border border-primary bg-primary text-xs font-semibold uppercase tracking-[0.2em] transition-colors active:bg-primary-hover"
          >
            <WhatsAppIcon className="size-5" />
            Agendar no WhatsApp
          </a>
          <p className="mt-4 text-center text-sm text-white/60">{footer}</p>
        </div>
      </dialog>
    </>
  );
}
