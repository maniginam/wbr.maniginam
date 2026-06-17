// Cloudflare Pages middleware: Markdown for Agents (RFC content negotiation).
// HTML stays the default for browsers. Only when a client explicitly prefers
// `Accept: text/markdown` do we return a markdown rendering of the page.
// Any failure falls back to the original HTML response — never breaks browsers.

export async function onRequest(context) {
  const { request, next } = context;
  const response = await next();

  if (!prefersMarkdown(request.headers.get("Accept"))) return response;

  const contentType = response.headers.get("Content-Type") || "";
  if (!response.ok || !contentType.includes("text/html")) return response;

  const html = await response.text();
  try {
    const markdown = htmlToMarkdown(html);
    if (!markdown.trim()) return rebuildHtml(html, response);

    const headers = new Headers();
    headers.set("Content-Type", "text/markdown; charset=utf-8");
    headers.set("Link", "</sitemap.xml>; rel=\"sitemap\"");
    headers.set("X-Markdown-Tokens", String(Math.ceil(markdown.length / 4)));
    headers.set("Vary", "Accept");
    return new Response(markdown, { status: response.status, headers });
  } catch {
    return rebuildHtml(html, response);
  }
}

function rebuildHtml(html, original) {
  return new Response(html, { status: original.status, headers: original.headers });
}

// True only when the client lists text/markdown and does not rank text/html higher.
function prefersMarkdown(accept) {
  if (!accept) return false;
  const types = accept.split(",").map((part) => {
    const [type, ...params] = part.trim().split(";");
    const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    let qv = q ? parseFloat(q.slice(2)) : 1;
    if (isNaN(qv)) qv = 1;
    return { type: type.trim().toLowerCase(), q: qv };
  });
  const md = types.find((t) => t.type === "text/markdown");
  if (!md) return false;
  const html = types.find((t) => t.type === "text/html");
  return !html || md.q >= html.q;
}

function htmlToMarkdown(html) {
  const region = extractContent(html);
  const title = firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);

  let md = region;
  // Drop non-content blocks entirely.
  md = stripBlocks(md, ["script", "style", "svg", "nav", "form", "header", "footer", "aside"]);
  md = md.replace(/<!--[\s\S]*?-->/g, "");

  md = convertTables(md);

  // Block-level elements.
  md = md.replace(/<h([2-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, text) => {
    return "\n\n" + "#".repeat(Number(level)) + " " + inline(text).trim() + "\n\n";
  });
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, text) => "\n- " + inline(text).trim());
  md = md.replace(/<\/(ul|ol)>/gi, "\n\n");
  md = md.replace(/<(ul|ol)[^>]*>/gi, "\n");
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, text) => "\n\n> " + inline(text).trim() + "\n\n");
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, text) => "\n\n" + inline(text).trim() + "\n\n");

  md = inline(md);
  md = md.replace(/<[^>]+>/g, ""); // strip any leftover tags
  md = decodeEntities(md);
  md = md.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  const heading = title ? "# " + decodeEntities(inline(title)).trim() + "\n\n" : "";
  return heading + md + "\n";
}

// Prefer the article body, then <main>, then <body>.
function extractContent(html) {
  return (
    firstMatch(html, /<article[^>]*class="[^"]*article-content[^"]*"[^>]*>([\s\S]*?)<\/article>/i) ||
    firstMatch(html, /<main[^>]*>([\s\S]*?)<\/main>/i) ||
    firstMatch(html, /<body[^>]*>([\s\S]*?)<\/body>/i) ||
    html
  );
}

function convertTables(html) {
  return html.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, table) => {
    const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) =>
      [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => inline(c[1]).replace(/\|/g, "\\|").trim())
    );
    if (!rows.length) return "";
    const out = ["", "| " + rows[0].join(" | ") + " |", "| " + rows[0].map(() => "---").join(" | ") + " |"];
    for (let i = 1; i < rows.length; i++) out.push("| " + rows[i].join(" | ") + " |");
    return "\n" + out.join("\n") + "\n\n";
  });
}

function inline(text) {
  return text
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, _t, c) => "**" + c.trim() + "**")
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_, _t, c) => "*" + c.trim() + "*")
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, c) => "`" + c.trim() + "`")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, c) => "[" + c.trim() + "](" + href + ")")
    .replace(/<br\s*\/?>/gi, "\n");
}

function stripBlocks(html, tags) {
  for (const tag of tags) {
    html = html.replace(new RegExp("<" + tag + "[^>]*>[\\s\\S]*?<\\/" + tag + ">", "gi"), "");
  }
  return html;
}

function firstMatch(text, regex) {
  const m = text.match(regex);
  return m ? m[1] : "";
}

const NAMED_ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  times: "×", middot: "·", rarr: "→", larr: "←",
  mdash: "—", ndash: "–", hellip: "…", copy: "©",
  reg: "®", deg: "°", trade: "™", eacute: "é",
};

function decodeEntities(text) {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, body) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named !== undefined ? named : match;
  });
}
