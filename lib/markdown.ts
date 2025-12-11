function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(text: string) {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/_([^_]+)_/g, "<em>$1</em>");
  return out;
}

export function renderMarkdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];

  let inCode = false;
  let codeFenceLang = "";
  let codeLines: string[] = [];
  let paragraphLines: string[] = [];
  let blockquoteLines: string[] = [];
  let referenceLines: Array<{ id: string; raw: string }> = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    const text = paragraphLines.join("\n").trimEnd();
    const withBreaks = text.replace(/  \n/g, "<br />\n");
    html.push(`<p>${renderInline(withBreaks)}</p>`);
    paragraphLines = [];
  };

  const flushBlockquote = () => {
    if (blockquoteLines.length === 0) return;
    const text = blockquoteLines.join("\n").trimEnd();
    const withBreaks = text.replace(/  \n/g, "<br />\n");
    html.push(`<blockquote>${renderInline(withBreaks)}</blockquote>`);
    blockquoteLines = [];
  };

  const flushReferences = () => {
    if (referenceLines.length === 0) return;
    const lines = referenceLines.map(({ id, raw }) => {
      const ref = parseReference(raw);
      const text = escapeHtml(ref.text);
      const linkHtml = ref.url
        ? `<a href="${escapeHtml(ref.url)}"><b>${text}</b></a>`
        : `<b>${text}</b>`;
      return `<a name="footnote_${id}"></a><a href="#back_${id}">^</a> [${id}] ${linkHtml}<br />`;
    });
    html.push(`<p id="paperbox" style="text-align:left;">${lines.join("\n")}</p>`);
    referenceLines = [];
  };

  const flushCode = () => {
    const codeText = escapeHtml(codeLines.join("\n"));
    const classAttr = codeFenceLang ? ` class="language-${codeFenceLang}"` : "";
    html.push(`<pre><code${classAttr}>${codeText}</code></pre>`);
    codeLines = [];
    codeFenceLang = "";
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, "  ");

    if (inCode) {
      if (line.startsWith("```")) {
        inCode = false;
        flushCode();
        continue;
      }
      codeLines.push(rawLine);
      continue;
    }

    if (line.startsWith("```")) {
      flushParagraph();
      flushBlockquote();
      inCode = true;
      codeFenceLang = line.slice(3).trim();
      continue;
    }

    if (line.startsWith(">")) {
      flushParagraph();
      blockquoteLines.push(line.replace(/^>\s?/, ""));
      continue;
    }

    if (blockquoteLines.length > 0 && line.trim() === "") {
      flushBlockquote();
      continue;
    }

    if (line.trim() === "References") {
      flushParagraph();
      flushBlockquote();
      flushReferences();
      html.push(`<div class="heading">References</div>`);
      html.push("<hr />");
      continue;
    }

    const refMatch = line.trim().match(/^\^\[(\d+)\]\s*(.*)$/);
    if (refMatch) {
      flushParagraph();
      flushBlockquote();
      referenceLines.push({ id: refMatch[1], raw: refMatch[2] });
      continue;
    }

    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      flushParagraph();
      flushBlockquote();
      flushReferences();
      html.push(`<h2>${renderInline(h2[1])}</h2>`);
      continue;
    }

    const h3 = line.match(/^###\s+(.*)$/);
    if (h3) {
      flushParagraph();
      flushBlockquote();
      html.push(`<h3>${renderInline(h3[1])}</h3>`);
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      flushBlockquote();
      flushReferences();
      continue;
    }

      const imgMatch = line.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      flushParagraph();
      flushBlockquote();
      const alt = escapeHtml(imgMatch[1]);
      let src = imgMatch[2];
      // Add basePath for absolute URLs
      if (src.startsWith('/') && !src.startsWith('//')) {
        src = '/blog' + src;
      }
      src = escapeHtml(src);
      html.push(
        `<figure>` +
          `<img src="${src}" alt="${alt}" class="pixel markdown-image" />` +
          (alt ? `<figcaption>${alt}</figcaption>` : "") +
          `</figure>`
      );
      continue;
    }

    paragraphLines.push(rawLine);
  }

  flushParagraph();
  flushBlockquote();
  flushReferences();
  if (inCode) flushCode();

  return html.join("\n");
}

function parseReference(raw: string) {
  const link = raw.match(/\[(.+?)\]\((.+?)\)/);
  if (link) {
    return { text: link[1], url: link[2] };
  }
  return { text: raw.trim(), url: "" };
}
