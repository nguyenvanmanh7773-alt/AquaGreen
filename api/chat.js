let currentModelIndex = 0;
let workingModels = [
  'models/gemini-3.8-flash-lite',
  'models/gemini-3.8-pro',
  'models/gemini-3.8-flash'
];
let hasFetchedModels = false;

function smartLocalAssistant(msg) {
  const clean = msg.trim();
  const lower = clean.toLowerCase();

  // Tự động tính toán nếu người dùng thử phép tính (VD: "1+1", "1+1 bằng mấy", "25*4")
  const mathMatch = clean.match(/(\d+)\s*([\+\-\*\/xX:])\s*(\d+)/);
  if (mathMatch) {
    const a = parseFloat(mathMatch[1]);
    const op = mathMatch[2];
    const b = parseFloat(mathMatch[3]);
    let res = 0;
    if (op === '+') res = a + b;
    else if (op === '-') res = a - b;
    else if (op === '*' || op.toLowerCase() === 'x') res = a * b;
    else if (op === '/' || op === ':') res = b !== 0 ? a / b : 'không xác định';
    return `Kết quả của ${a} ${op} ${b} là **${res}** nhé! Ngoài toán học ra, mình luôn sẵn sàng hỗ trợ bạn phân loại rác, báo cáo kênh ô nhiễm (+50đ) và chơi game bảo vệ môi trường trên AquaGreen Sài Gòn! 🌿`;
  }

  if (lower.includes('phân loại') || lower.includes('rác')) {
    return 'Rác thải sinh hoạt được chia làm 3 nhóm chính:\n1. **Rác hữu cơ** (thức ăn thừa, rau củ): dễ phân hủy, làm phân compost.\n2. **Rác tái chế** (nhựa sạch, lon kim loại, giấy carton): bán phế liệu hoặc tái sản xuất.\n3. **Rác còn lại** (túi nilon bẩn, sành sứ vỡ): đem đi xử lý chôn lấp/đốt.\nPhân loại đúng giúp giảm tải ô nhiễm cho các dòng kênh TP.HCM! ♻️';
  }
  if (lower.includes('báo cáo') || lower.includes('ô nhiễm') || lower.includes('bản đồ')) {
    return 'Để báo cáo điểm đen ô nhiễm trên AquaGreen:\n- Kéo xuống phần **Bản Đồ Kênh Rạch**.\n- Nhấp vào vị trí kênh rạch bị ô nhiễm, điền mô tả và tải ảnh minh chứng lên.\n- Sau khi Admin phê duyệt báo cáo, bạn sẽ được cộng ngay **+50 điểm thưởng** vào tài khoản! 📍';
  }
  if (lower.includes('game') || lower.includes('chơi') || lower.includes('trắc nghiệm') || lower.includes('điểm')) {
    return 'Bạn có thể tích điểm đổi quà qua 2 hoạt động thú vị:\n- **Trắc Nghiệm Xanh:** Trả lời 20 câu hỏi ngẫu nhiên về môi trường.\n- **Game Pixel Sài Gòn Xanh:** Điều khiển nhân vật vớt rác trên kênh rạch qua từng màn chơi để ghi danh lên Bảng Xếp Hạng! 🎮';
  }
  if (lower.includes('an toàn') || lower.includes('bảo hộ') || lower.includes('lội kênh')) {
    return 'Quy chuẩn an toàn khi tham gia dọn rác kênh rạch: Bắt buộc trang bị đồ bảo hộ chống thấm nước, ủng cao cổ, găng tay chống cắt dày, khẩu trang hoạt tính và phải tiêm phòng uốn ván đầy đủ! 🛡️';
  }
  return 'Chào bạn! Mình là Trợ lý AI của AquaGreen Sài Gòn. Bạn có thể hỏi mình về cách phân loại rác thải, hướng dẫn báo cáo kênh ô nhiễm nhận +50 điểm, quy tắc an toàn hoặc cách tham gia trò chơi trên web nhé! 🌱';
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
  const systemInstruction = "Bạn là Trợ lý AI thông minh của dự án môi trường AquaGreen Sài Gòn. Hãy trả lời chính xác, tự nhiên và ngắn gọn (2-4 câu) bằng tiếng Việt cho MỌI câu hỏi của người dùng (kể cả toán học, kiến thức chung hay môi trường). Nếu hỏi về tính năng web, hãy nhắc đến: Báo cáo kênh ô nhiễm trên bản đồ (+50đ), Trắc nghiệm môi trường và Game Pixel vớt rác.";

  if (apiKey) {
    try {
      // Lấy danh sách model hợp lệ 1 lần duy nhất để xoay vòng khi hết quota
      if (!hasFetchedModels) {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const listData = await listRes.json();
        if (listData?.models) {
          const discovered = listData.models
            .filter(m => 
              m.supportedGenerationMethods?.includes('generateContent') &&
              !m.name.includes('1.5') &&
              !m.name.includes('2.5') &&
              !m.name.includes('2.0')
            )
            .map(m => m.name);
          if (discovered.length > 0) {
            workingModels = [...new Set([...workingModels, ...discovered])];
          }
          hasFetchedModels = true;
        }
      }

      // Thử từ model đang hoạt động tốt nhất hiện tại
      for (let i = 0; i < workingModels.length; i++) {
        const idx = (currentModelIndex + i) % workingModels.length;
        const modelName = workingModels[idx];

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: 'user', parts: [{ text: message }] }],
            generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
          })
        });

        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (response.ok && reply) {
          currentModelIndex = idx; // Nhớ ngay model đang còn hạn mức để lần sau gọi thẳng cực nhanh
          return res.status(200).json({ reply });
        }
      }
    } catch (err) {
      // Nếu lỗi kết nối thì chuyển xuống trợ lý nội bộ
    }
  }

  // Nếu tất cả các model trong tài khoản đều hết sạch 20 câu/ngày, trả lời tức thì bằng trợ lý nội bộ
  return res.status(200).json({ reply: smartLocalAssistant(message) });
}
