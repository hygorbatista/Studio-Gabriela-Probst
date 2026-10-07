import { readFile } from "node:fs/promises";
import { join } from "node:path";

const noir = "#0B0B0C";

export async function loadBrandFonts() {
  const dir = join(process.cwd(), "assets/fonts");
  const [playfair, jakarta] = await Promise.all([
    readFile(join(dir, "playfair-display-latin-400-normal.woff")),
    readFile(join(dir, "plus-jakarta-sans-latin-600-normal.woff")),
  ]);
  return [
    { name: "Playfair Display", data: playfair, style: "normal", weight: 400 },
    { name: "Plus Jakarta Sans", data: jakarta, style: "normal", weight: 600 },
  ] as const;
}

export function Monogram({ size }: { size: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: noir,
        color: "#FFFFFF",
        fontFamily: "Playfair Display",
        fontSize: size * 0.74,
        lineHeight: 1,
        paddingBottom: size * 0.05,
      }}
    >
      G
    </div>
  );
}

export function ShareCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: noir,
        color: "#FFFFFF",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 40,
          right: 40,
          bottom: 40,
          display: "flex",
          border: "1px solid rgba(255,255,255,0.14)",
        }}
      />
      <div style={{ fontFamily: "Playfair Display", fontSize: 124, lineHeight: 1 }}>
        Gabriela Probst
      </div>
      <div
        style={{
          width: 72,
          height: 2,
          marginTop: 44,
          marginBottom: 36,
          background: "#A32842",
        }}
      />
      <div
        style={{
          fontFamily: "Plus Jakarta Sans",
          fontWeight: 600,
          fontSize: 26,
          letterSpacing: 8,
          color: "rgba(255,255,255,0.75)",
        }}
      >
        NAIL STUDIO
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 76,
          display: "flex",
          fontFamily: "Plus Jakarta Sans",
          fontWeight: 600,
          fontSize: 18,
          letterSpacing: 4,
          color: "rgba(255,255,255,0.45)",
        }}
      >
        SERRARIA · SÃO JOSÉ
      </div>
    </div>
  );
}
