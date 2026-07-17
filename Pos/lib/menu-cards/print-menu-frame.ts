import type { MenuPrintOrientation } from "@/components/admin/menu-cards/menu-print-preview";

const A4_MM = { width: 210, height: 297 };
const PRINT_PADDING_MM = 8;

function mmToPx(mm: number) {
  return mm * (96 / 25.4);
}

function printablePage(orientation: MenuPrintOrientation) {
  const pageWidth = orientation === "landscape" ? A4_MM.height : A4_MM.width;
  const pageHeight = orientation === "landscape" ? A4_MM.width : A4_MM.height;
  return {
    pageWidthPx: mmToPx(pageWidth),
    pageHeightPx: mmToPx(pageHeight),
    contentWidthPx: mmToPx(pageWidth - PRINT_PADDING_MM * 2),
    contentHeightPx: mmToPx(pageHeight - PRINT_PADDING_MM * 2),
  };
}

function absolutizeImageSources(root: HTMLElement) {
  root.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src");
    if (!src || src.startsWith("http") || src.startsWith("data:")) return;
    img.setAttribute("src", `${window.location.origin}${src.startsWith("/") ? src : `/${src}`}`);
  });
}

let printFrame: HTMLIFrameElement | null = null;

export function printMenuPaper(
  paper: HTMLElement,
  orientation: MenuPrintOrientation,
): void {
  if (!printFrame) {
    printFrame = document.createElement("iframe");
    printFrame.setAttribute("aria-hidden", "true");
    printFrame.setAttribute("title", "Menu print");
    printFrame.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
    document.body.appendChild(printFrame);
  }

  const frameWindow = printFrame.contentWindow;
  const doc = printFrame.contentDocument;
  if (!frameWindow || !doc) return;

  const clone = paper.cloneNode(true) as HTMLElement;
  absolutizeImageSources(clone);

  const pageSize = orientation === "landscape" ? "A4 landscape" : "A4 portrait";
  const { pageWidthPx, pageHeightPx, contentWidthPx, contentHeightPx } =
    printablePage(orientation);

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title> </title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Lora:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${window.location.origin}/menu-print.css" />
  <style>
    @page { size: ${pageSize}; margin: 0; }
    html, body {
      margin: 0;
      padding: 0;
      width: ${pageWidthPx}px;
      height: ${pageHeightPx}px;
      max-height: ${pageHeightPx}px;
      overflow: hidden;
      background: #0a0a0a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .menu-print-frame-shell {
      width: ${pageWidthPx}px;
      height: ${pageHeightPx}px;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: ${mmToPx(PRINT_PADDING_MM)}px;
      box-sizing: border-box;
      background: #0a0a0a;
    }
    .menu-print-paper {
      width: ${contentWidthPx}px !important;
      max-width: ${contentWidthPx}px !important;
      transform-origin: top center;
    }
  </style>
</head>
<body>
  <div class="menu-print-frame-shell">
    ${clone.outerHTML}
  </div>
</body>
</html>`);
  doc.close();

  let printed = false;
  const runPrint = () => {
    if (printed) return;
    printed = true;

    const framePaper = doc.querySelector(".menu-print-paper") as HTMLElement | null;
    if (framePaper) {
      const contentHeight = framePaper.scrollHeight;
      const scale = Math.min(1, contentHeightPx / contentHeight);
      if (scale < 0.995) {
        framePaper.style.transform = `scale(${scale})`;
      }
    }

    window.setTimeout(() => {
      frameWindow.focus();
      frameWindow.print();
    }, 50);
  };

  const stylesheet = doc.querySelector('link[href*="menu-print.css"]') as HTMLLinkElement | null;
  if (stylesheet) {
    stylesheet.addEventListener("load", runPrint, { once: true });
    stylesheet.addEventListener("error", runPrint, { once: true });
  }

  window.setTimeout(runPrint, 400);
}
