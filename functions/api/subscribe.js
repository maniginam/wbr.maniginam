// POST /api/subscribe — store-only email capture into D1.
// Binding: env.DB (D1). Validates input, blocks honeypot bots, ignores dupes.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  // Honeypot: real users never fill this. Pretend success so bots don't probe.
  if (data.company) return json({ ok: true });

  const name = (data.name || '').toString().trim().slice(0, 120);
  const email = (data.email || '').toString().trim().toLowerCase().slice(0, 254);
  const source = (data.source || '').toString().trim().slice(0, 120);

  if (!name || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'invalid_input' }, 422);
  }

  if (!env.DB) return json({ ok: false, error: 'no_database' }, 503);

  try {
    await env.DB
      .prepare('INSERT OR IGNORE INTO subscribers (name, email, source, user_agent) VALUES (?, ?, ?, ?)')
      .bind(name, email, source, (request.headers.get('User-Agent') || '').slice(0, 255))
      .run();
  } catch (err) {
    return json({ ok: false, error: 'db_error' }, 500);
  }

  return json({ ok: true });
}
