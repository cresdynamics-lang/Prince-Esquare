
require("dotenv").config();
const sharp = require("sharp");
async function main() {
  const img = await sharp({ create: { width: 640, height: 800, channels: 3, background: { r: 40, g: 60, b: 100 } } })
    .jpeg({ quality: 70 }).toBuffer();
  const b64 = img.toString("base64");
  const keyG = process.env.GEMINI_API_KEY;
  const keyQ = process.env.GROQ_API_KEY;

  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + encodeURIComponent(keyG) + "&pageSize=80");
    const body = await r.json();
    const vision = (body.models || [])
      .filter(m => (m.supportedGenerationMethods||[]).includes("generateContent"))
      .map(m => m.name.replace("models/",""))
      .filter(n => /flash|lite|gemma|2\.0|2\.5|1\.5|pro/i.test(n));
    console.log("GEMINI_MODELS", vision.join(" | "));
  } catch (e) { console.log("list err", e.message); }

  const geminiModels = [
    "gemini-flash-latest",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemma-3-27b-it",
    "gemini-1.5-flash",
  ];
  for (const model of geminiModels) {
    const t = Date.now();
    try {
      const url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent";
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": keyG },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [
            { text: "Return only JSON with key name and value test shirt" },
            { inline_data: { mime_type: "image/jpeg", data: b64 } }
          ]}],
          generationConfig: { responseMimeType: "application/json", maxOutputTokens: 64 }
        })
      });
      const body = await r.json();
      if (!r.ok) console.log("G FAIL", model, (Date.now()-t)+"ms", String(body.error?.message||"").slice(0,160));
      else console.log("G OK", model, (Date.now()-t)+"ms");
    } catch (e) { console.log("G ERR", model, e.message); }
  }

  try {
    const r = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: "Bearer " + keyQ }
    });
    const body = await r.json();
    const names = (body.data||[]).map(m => m.id);
    console.log("GROQ_ALL", names.filter(id => /llama|qwen|vision|scout|maverick|llava|pixtral|4o|gpt/i.test(id)).join(" | "));
  } catch (e) { console.log("groq list", e.message); }

  const groqModels = [
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "qwen/qwen3.6-27b",
    "llama-3.2-11b-vision-preview",
    "llama-3.2-90b-vision-preview",
    "moonshotai/kimi-k2-instruct",
  ];
  for (const model of groqModels) {
    const t = Date.now();
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: "Bearer " + keyQ, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_completion_tokens: 64,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "Return JSON only with name string" },
            { role: "user", content: [
              { type: "text", text: "Name product" },
              { type: "image_url", image_url: { url: "data:image/jpeg;base64," + b64 } }
            ]}
          ]
        })
      });
      const body = await r.json();
      if (!r.ok) console.log("Q FAIL", model, (Date.now()-t)+"ms", String(body.error?.message||"").slice(0,160));
      else console.log("Q OK", model, (Date.now()-t)+"ms", String(body.choices?.[0]?.message?.content||"").slice(0,60));
    } catch (e) { console.log("Q ERR", model, e.message); }
  }
}
main();
