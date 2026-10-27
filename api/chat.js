export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  const { message } = body || {};
  if (!message) {
    return res.status(400).json({ error: 'Tin nhắn không được để trống' });
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(500).json({ error: 'Chưa cấu hình GEMINI_API_KEY trên Vercel' });
  }

  const systemPrompt = "Bạn là Trợ lý AI của AquaGreen Sài Gòn. Hãy giải đáp thân thiện, tích cực bằng tiếng Việt về phân loại rác và bảo vệ môi trường, kênh rạch TP.HCM. Hướng dẫn người dùng các tính năng: Báo cáo kênh ô nhiễm trên bản đồ (+50đ), thi Trắc nghiệm 20 câu, và Game Pixel vớt rác. Trả lời súc tích, ngắn gọn 2-4 câu.";

  try {
    // 1. Tự động lấy danh sách model thực tế từ chính Google API của tài khoản
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listRes.json();

    if (!listData.models || listData.models.length === 0) {
      const errMsg = listData.error?.message || 'Không lấy được danh sách model từ Google AI';
      return res.status(500).json({ 
        error: errMsg,
        reply: `⚠️ ${errMsg}`
      });
    }

    // 2. Lọc các model có hỗ trợ generateContent
    const validModels = listData.models.filter(m => 
      m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
    );

    // Ưu tiên model chứa chữ "flash", nếu không thì lấy bất kỳ model hợp lệ đầu tiên
    const target = validModels.find(m => m.name && m.name.includes('flash')) || validModels[0];

    if (!target) {
      return res.status(500).json({ 
        error: 'Tài khoản chưa có model nào hỗ trợ chat',
        reply: '⚠️ Tài khoản Google AI chưa có model nào hỗ trợ generateContent.'
      });
    }

    // 3. Gọi model đã được Google xác nhận
    const modelPath = target.name.startsWith('models/') ? target.name : `models/${target.name}`;
    const chatRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nNgười dùng hỏi: ${message}` }]
          }
        ]
      })
    });

    const chatData = await chatRes.json();

    if (chatRes.ok && chatData?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return res.status(200).json({
        reply: chatData.candidates[0].content.parts[0].text
      });
    } else {
      const errMsg = chatData?.error?.message || 'Google AI không thể tạo phản hồi';
      return res.status(500).json({
        error: errMsg,
        reply: `⚠️ ${errMsg}`
      });
    }
  } catch (err) {
    const errMsg = 'Lỗi server: ' + err.message;
    return res.status(500).json({ 
      error: errMsg,
      reply: `⚠️ ${errMsg}`
    });
  }
}
