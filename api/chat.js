function getSmartFallbackReply(msg) {
  const lower = (msg || '').toLowerCase();
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

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  const { message } = body || {};
  if (!message) {
    return res.status(400).json({ error: 'Tin nhắn không được để trống' });
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const systemPrompt = "Bạn là Trợ lý AI của AquaGreen Sài Gòn. Hãy giải đáp thân thiện, tích cực bằng tiếng Việt về phân loại rác và bảo vệ môi trường, kênh rạch TP.HCM. Hướng dẫn người dùng các tính năng: Báo cáo kênh ô nhiễm trên bản đồ (+50đ), thi Trắc nghiệm 20 câu, và Game Pixel vớt rác. Trả lời súc tích, ngắn gọn 2-4 câu.";

  if (apiKey) {
    try {
      // 1. Lấy danh sách model thực tế từ Google
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const listData = await listRes.json();

      let candidateModels = ['models/gemini-3.8-flash', 'models/gemini-3.8-pro'];

      if (listData?.models) {
        const dynamicModels = listData.models
          .filter(m => 
            m.supportedGenerationMethods?.includes('generateContent') &&
            !m.name.includes('2.5') &&
            !m.name.includes('2.0') &&
            !m.name.includes('1.5') &&
            !m.name.includes('1.0')
          )
          .map(m => m.name);

        // Ưu tiên đưa model 3.8 và flash lên đầu danh sách thử
        dynamicModels.sort((a, b) => {
          const aScore = (a.includes('3.8') ? 2 : 0) + (a.includes('flash') ? 1 : 0);
          const bScore = (b.includes('3.8') ? 2 : 0) + (b.includes('flash') ? 1 : 0);
          return bScore - aScore;
        });

        candidateModels = [...new Set([...candidateModels, ...dynamicModels])];
      }

      // 2. Thử lần lượt từng model hợp lệ cho đến khi thành công
      for (const modelName of candidateModels) {
        try {
          const cleanName = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
          const chatRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${cleanName}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nNgười dùng hỏi: ${message}` }] }]
            })
          });

          const chatData = await chatRes.json();
          const replyText = chatData?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (chatRes.ok && replyText) {
            return res.status(200).json({ reply: replyText });
          }
        } catch (innerErr) {
          continue;
        }
      }
    } catch (err) {
      // Chuyển sang cơ chế dự phòng bên dưới nếu mạng hoặc API lỗi
    }
  }

  // 3. Trả lời bằng bộ kiến thức AI nội bộ nếu tất cả model Google đang bận
  return res.status(200).json({
    reply: getSmartFallbackReply(message)
  });
}
