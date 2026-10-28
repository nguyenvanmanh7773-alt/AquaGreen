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
    return res.status(500).json({ error: 'Chưa cấu hình GEMINI_API_KEY' });
  }

  const systemPrompt = "Bạn là Trợ lý AI của AquaGreen Sài Gòn. Hãy giải đáp thân thiện, tích cực bằng tiếng Việt về phân loại rác và bảo vệ môi trường, kênh rạch TP.HCM. Hướng dẫn người dùng các tính năng: Báo cáo kênh ô nhiễm trên bản đồ (+50đ), thi Trắc nghiệm 20 câu, và Game Pixel vớt rác. Nếu người dùng hỏi các câu giao tiếp cơ bản (chào hỏi) hoặc tính toán đơn giản, hãy trả lời ngắn gọn và khéo léo dẫn dắt về chủ đề môi trường của AquaGreen.";

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const chatRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nNgười dùng hỏi: ${message}` }] }],
        generationConfig: {
          maxOutputTokens: 300,
          temperature: 0.7
        }
      })
    });

    const chatData = await chatRes.json();
    
    if (chatRes.ok && chatData?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return res.status(200).json({ reply: chatData.candidates[0].content.parts[0].text });
    } else {
      // Báo chính xác lỗi từ Google ra khung chat
      const errorMsg = chatData?.error?.message || 'Lỗi không xác định từ Google API';
      return res.status(500).json({ error: `Lỗi Google: ${errorMsg}` });
    }
  } catch (err) {
    return res.status(500).json({ error: `Lỗi máy chủ Node.js: ${err.message}` });
  }
}
