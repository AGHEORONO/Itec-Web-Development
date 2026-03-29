import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt, code, language } = await request.json();
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      return NextResponse.json({ suggestion: "Gemini API Key is missing from the server system. Add GEMINI_API_KEY in the isolated .env.local file" }, { status: 401 });
    }

    // Abordare Direct-to-Engine (Cel mai stabil mod de apel gratuit pentru Hackathon)
    const payload = {
      contents: [{
        parts: [{
          text: `You are the "iTECify Technical Expert". You are analyzing the following code written in ${language}:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nThe programmer's request is:\n"${prompt}"\n\nRespond precisely, briefly, and strictly in English. If you find errors, point them out. Generate clear code snippets using Markdown if a practical solution is requested.`
        }]
      }]
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ suggestion: `API Access blocked: ${data.error.message}` }, { status: 500 });
    }

    const suggestionText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error: Internal algorithmic service returned a null response.";

    return NextResponse.json({ suggestion: suggestionText });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ suggestion: `Internal connection failed` }, { status: 500 });
  }
}
