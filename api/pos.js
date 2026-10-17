export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Método no permitido" });
  const endpoint = process.env.APPS_SCRIPT_URL;
  if (!endpoint) return res.status(500).json({ ok: false, error: "Falta configurar APPS_SCRIPT_URL en las variables de entorno de Vercel." });
  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(req.body)
    });
    const raw = await upstream.text();
    let data;
    try { data = JSON.parse(raw); } catch { throw new Error("Apps Script no devolvió JSON. Verifica que la implementación esté configurada como aplicación web accesible para cualquier usuario."); }
    return res.status(upstream.ok ? 200 : 502).json(data);
  } catch (e) {
    return res.status(502).json({ ok: false, error: e.message || "No se pudo conectar con Google Apps Script." });
  }
}