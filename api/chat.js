function getSmartFallbackReply(msg) {
  const lower = msg.toLowerCase();
  if (lower.includes('phân loại') || lower.includes('rác')) {
    return 'Rác thải được chia làm 3 loại chính: Rác hữu cơ (thức ăn thừa, lá cây - dễ phân hủy), Rác tái chế (nhựa, giấy, kim loại) và Rác vô cơ/còn lại (túi nilon bẩn, sành sứ). Phân loại đúng tại nguồn giúp giảm tải ô nhiễm cho các dòng kênh Sài Gòn! 🌿';
  }
  if (lower.includes('báo cáo') || lower.includes('ô nhiễm') || lower.includes('bản đồ')) {
    return 'Để báo cáo điểm đen ô nhiễm, bạn hãy kéo xuống mục "Bản Đồ Kênh Rạch", chọn vị trí trên bản đồ, điền thông tin mô tả kèm hình ảnh rồi nhấn Gửi. Khi được Admin duyệt, bạn sẽ nhận ngay +50 điểm thưởng! 📍';
  }
  if (lower.includes('game') || lower.includes('chơi') || lower.includes('trắc nghiệm') || lower.includes('điểm')) {
    return 'Trên AquaGreen, bạn có thể tham gia "Trắc Nghiệm Xanh" (20 câu hỏi môi trường) hoặc chơi "Game Pixel Chiến Binh Lội Kênh" để vớt rác qua các màn chơi và tích lũy điểm thưởng vinh danh trên Bảng Xếp Hạng! 🎮';
  }
  if (lower.includes('an toàn') || lower.includes('bảo hộ') || lower.includes('lội kênh')) {
    return 'Khi tham gia lội kênh dọn rác, bạn bắt buộc phải mặc đồ bảo hộ chống thấm, mang ủng cao cổ, găng tay chống cắt và tiêm phòng uốn ván đầy đủ để bảo vệ sức khỏe nhé! 🛡️';
  }
  return 'Chào bạn! Mình là Trợ lý AI của AquaGreen Sài Gòn. Bạn có thể hỏi mình về cách phân loại rác, hướng dẫn báo cáo kênh ô nhiễm trên bản đồ (+50đ), quy chuẩn an toàn lội kênh hoặc cách chơi game tích điểm nhé! 🌱';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: 'Tin nhắn không được để trống' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const systemPrompt = "Bạn là Trợ lý AI của AquaGreen Sài Gòn. Hãy giải đáp thân thiện, tích cực bằng tiếng Việt về phân loại rác và bảo vệ môi trường, kênh rạch TP.HCM. Hướng dẫn người dùng các tính năng: Báo cáo kênh ô nhiễm trên bản đồ (+50đ), thi Trắc nghiệm 20 câu, và Game Pixel vớt rác. Trả lời súc tích, ngắn gọn 2-4 câu.";

  if (apiKey) {
    try {
      // Gọi thẳng trực tiếp model 3.8-flash siêu tốc
      const chatRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nNgười dùng hỏi: ${message}` }] }],
          generationConfig: {
            maxOutputTokens: 250,
            temperature: 0.7
          }
        })
      });

      const chatData = await chatRes.json();
      const replyText = chatData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (chatRes.ok && replyText) {
        return res.status(200).json({ reply: replyText });
      }
    } catch (err) {
      // Gặp lỗi thì tự rơi xuống fallback bên dưới
    }
  }

  // Dự phòng phản hồi lập tức nếu mạng bận
  return res.status(200).json({
    reply: getSmartFallbackReply(message)
  });
}
