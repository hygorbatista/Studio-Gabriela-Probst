// JSON-LD vai num <script> nativo (não next/script): é dado, não código executável.
// O replace evita que um "<" dentro dos dados feche a tag (proteção contra XSS).
export function StructuredData({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
