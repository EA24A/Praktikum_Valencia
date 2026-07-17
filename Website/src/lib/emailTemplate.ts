const BRAND = {
  gold: "#C9A84C",
  goldLight: "#DDBC6A",
  goldDark: "#A8882A",
  sand: "#EFE3CA",
  sandMuted: "#C0A878",
  olive: "#A08C65",
  cream: "#080808",
  card: "#131313",
  muted: "#141100",
  border: "#3A3000",
  darkText: "#080808",
} as const;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function safe(value: string | null | undefined) {
  return escapeHtml(value ?? "");
}

type EmailLayoutOptions = {
  title: string;
  preheader?: string;
  body: string;
};

export function renderEmail({ title, preheader, body }: EmailLayoutOptions) {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safe(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.cream};color:${BRAND.sand};">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safe(preheader)}</div>` : ""}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.cream};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 24px;background:linear-gradient(135deg,#080808 0%,#0E0B00 55%,#141000 100%);border-bottom:1px solid ${BRAND.border};">
                <div style="font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.24em;text-transform:uppercase;color:${BRAND.gold};margin:0 0 10px;">
                  Casa Fenicia
                </div>
                <h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:30px;line-height:1.15;font-weight:600;color:${BRAND.sand};">
                  ${safe(title)}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 12px;font-family:Lora,Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:${BRAND.sand};">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 28px;font-family:Lora,Georgia,'Times New Roman',serif;font-size:13px;line-height:1.6;color:${BRAND.olive};border-top:1px solid ${BRAND.border};">
                <p style="margin:0 0 8px;">C/ de la Corretgeria, 4 · Ciutat Vella, Valencia</p>
                <p style="margin:0;">
                  <a href="tel:+34600345055" style="color:${BRAND.goldLight};text-decoration:none;">+34 600 345 055</a>
                  ·
                  <a href="${safe(process.env.NEXT_PUBLIC_APP_URL ?? "https://casafenicia.com")}" style="color:${BRAND.goldLight};text-decoration:none;">casafenicia.com</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function emailParagraph(text: string) {
  return `<p style="margin:0 0 16px;color:${BRAND.sand};">${text}</p>`;
}

export function emailMuted(text: string) {
  return `<p style="margin:0 0 16px;color:${BRAND.olive};">${text}</p>`;
}

export function emailHighlight(text: string) {
  return `<p style="margin:0 0 16px;color:${BRAND.goldLight};font-weight:600;">${text}</p>`;
}

export function emailDetailsBox(rows: { label: string; value: string }[]) {
  const rowsHtml = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:8px 0 0;font-family:Lora,Georgia,serif;font-size:12px;line-height:1.4;color:${BRAND.olive};text-transform:uppercase;letter-spacing:0.08em;">
            ${safe(row.label)}
          </td>
        </tr>
        <tr>
          <td style="padding:4px 0 12px;font-family:Lora,Georgia,serif;font-size:15px;line-height:1.5;color:${BRAND.sand};">
            ${safe(row.value)}
          </td>
        </tr>`
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0 20px;background:${BRAND.muted};border:1px solid ${BRAND.border};border-radius:12px;">
      <tr>
        <td style="padding:18px 20px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${rowsHtml}
          </table>
        </td>
      </tr>
    </table>`;
}

export function emailButton(label: string, href: string) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 8px;">
      <tr>
        <td style="border-radius:8px;background:${BRAND.gold};">
          <a href="${safe(href)}" style="display:inline-block;padding:12px 22px;font-family:Lora,Georgia,serif;font-size:14px;font-weight:600;color:${BRAND.darkText};text-decoration:none;border-radius:8px;">
            ${safe(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

export function emailSignoff() {
  return emailMuted("— El equipo de Casa Fenicia");
}

export { safe, BRAND };
