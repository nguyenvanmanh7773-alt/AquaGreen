export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: 'Tin nhắn không được để trống' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'LỖI: Chưa cấu hình GEMINI_API_KEY trên Vercel.' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: "Bạn là Trợ lý AI của AquaGreen Sài Gòn. Hãy giải đáp thân thiện, súc tích bằng tiếng Việt. Nếu người dùng hỏi toán học hoặc giao tiếp cơ bản, hãy trả lời chính xác sau đó khéo léo dẫn dắt về các tính năng của web (báo cáo kênh rạch, trắc nghiệm, game lội kênh)." }]
        },
        contents: [{ role: 'user', parts: [{ text: message }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
      })
    });

    const data = await response.json();

    if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
    } else {
      // In thẳng mã lỗi chi tiết của Google ra để sửa nếu có
      return res.status(500).json({ error: `LỖI GOOGLE API: ${data.error?.message || 'Lỗi không xác định'}` });
    }
  } catch (err) {
    return res.status(500).json({ error: `LỖI MÁY CHỦ: ${err.message}` });
  }
}
