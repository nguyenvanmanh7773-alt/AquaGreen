function getSmartFallbackReply(msg) {
  const lower = msg.toLowerCase();
  if (lower.includes('phân loại') || lower.includes('rác')) return 'Rác thải được chia làm 3 loại chính: Rác hữu cơ, rác tái chế và rác vô cơ/còn lại. Phân loại đúng tại nguồn giúp giảm tải ô nhiễm cho các dòng kênh Sài Gòn! 🌿';
  if (lower.includes('báo cáo') || lower.includes('ô nhiễm') || lower.includes('bản đồ')) return 'Để báo cáo điểm đen ô nhiễm, bạn hãy kéo xuống mục "Bản Đồ Kênh Rạch", chọn vị trí, điền thông tin và hình ảnh rồi nhấn Gửi. Khi được duyệt, bạn nhận ngay +50 điểm! 📍';
  if (lower.includes('game') || lower.includes('chơi') || lower.includes('trắc nghiệm') || lower.includes('điểm')) return 'Trên AquaGreen, bạn có thể thi "Trắc Nghiệm Xanh" (20 câu) hoặc chơi "Game Pixel Lội Kênh" để vớt rác và tích điểm trên Bảng Xếp Hạng! 🎮';
  if (lower.includes('an toàn') || lower.includes('bảo hộ')) return 'Khi lội kênh dọn rác, bạn bắt buộc phải mặc đồ bảo hộ chống thấm, mang ủng, găng tay và tiêm phòng uốn ván nhé! 🛡️';
  return 'Chào bạn! Mình là Trợ lý AI của AquaGreen. Bạn có thể hỏi mình về cách phân loại rác, báo cáo kênh ô nhiễm trên bản đồ (+50đ), hoặc cách chơi game tích điểm nhé! 🌱';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Tin nhắn không được để trống' });

  const apiKey = process.env.GEMINI_API_KEY;
  const systemPrompt = "Bạn là Trợ lý AI của AquaGreen Sài Gòn. Hãy giải đáp thân thiện, tích cực bằng tiếng Việt về phân loại rác và bảo vệ môi trường, kênh rạch TP.HCM. Hướng dẫn người dùng các tính năng: Báo cáo kênh ô nhiễm trên bản đồ (+50đ), thi Trắc nghiệm 20 câu, và Game Pixel vớt rác. Trả lời súc tích, ngắn gọn 2-4 câu.";

  if (apiKey) {
    try {
      // TUYỆT CHIÊU: Dùng mã ASCII 45 để ghép chuỗi chống auto-correct
      const dash = String.fromCharCode(45);
      const modelName = "gemini" + dash + "1.5" + dash + "flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const chatRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nNgười dùng hỏi: ${message}` }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
        })
      });

      const chatData = await chatRes.json();
      if (chatRes.ok && chatData?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return res.status(200).json({ reply: chatData.candidates[0].content.parts[0].text });
      }
    } catch (err) {
      // Nếu có lỗi gọi mạng, code sẽ bỏ qua để trượt xuống hàm dự phòng
    }
  }

  // Kích hoạt AI nội bộ khi mất mạng hoặc API lỗi
  return res.status(200).json({ reply: getSmartFallbackReply(message) });
}
