/**
 * Akademinin Bedrock API'si (Google Gemma) için istemci.
 * OpenAI-uyumlu `{model, messages}` -> `{choices:[{message:{content}}]}` şeması.
 */
export async function completeBedrock(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiUrl = process.env.BEDROCK_API_URL;
  const apiKey = process.env.BEDROCK_API_KEY;
  const modelId = process.env.BEDROCK_MODEL_ID || "google.gemma-4-31b";

  if (!apiUrl || !apiKey) {
    throw new Error(
      "BEDROCK_API_URL / BEDROCK_API_KEY tanımlı değil. .env.local dosyasına ekleyin."
    );
  }

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Bedrock API hatası (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text: string | undefined =
    data?.choices?.[0]?.message?.content ?? data?.output ?? data?.completion ?? data?.result;

  if (!text) {
    throw new Error(
      "Bedrock yanıtı beklenen şemada değil: " + JSON.stringify(data).slice(0, 500)
    );
  }
  return text;
}
