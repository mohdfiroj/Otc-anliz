import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    // Accept apiKey from client (manual entry) OR use server env var
    const apiKeyFromClient = form.get("apiKey");
    const OPENAI_API_KEY = apiKeyFromClient || process.env.OPENAI_API_KEY;

    // Demo: if no key provided, return random result for testing
    if (!OPENAI_API_KEY) {
      const dir = Math.random() > 0.5 ? "UP" : "DOWN";
      const conf = (70 + Math.random() * 25).toFixed(1);
      return NextResponse.json({ direction: dir, confidence: conf, message: "Demo mode (no OpenAI key provided)." });
    }

    // Read image bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    // Call OpenAI Chat Completions (vision-capable) - adjust model if needed
    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert OTC chart analyst. Analyze the given chart image and return JSON: {"direction":"UP" or "DOWN","confidence":number}. Do not add extra text." },
        { role: "user", content: "Here is the chart image:" },
        { role: "user", name: "image", content: `data:image/png;base64,${base64Image}` }
      ],
      max_tokens: 200
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    const reply = json.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(reply.replace(/```json|```/g, "").trim());
    } catch (err) {
      parsed = { direction: "DOWN", confidence: 50, message: "Could not parse model response." };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json({ error: "Server error", details: String(err) }, { status: 500 });
  }
}
