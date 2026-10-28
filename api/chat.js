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
    return `Kết quả của ${a} ${op} ${b} là **${res}** nhé! Ngoài ra, bạn có thể hỏi mình về phân loại rác, bản đồ ô nhiễm (+50đ) hoặc game vớt rác trên AquaGreen! 🌿`;
  }

  if (lower.includes('phân loại') || lower.includes('rác')) {
    return 'Rác thải sinh hoạt gồm 3 nhóm chính: Rác hữu cơ (thức ăn thừa), Rác tái chế (chai nhựa, giấy, kim loại) và Rác còn lại. Phân loại đúng giúp bảo vệ các dòng kênh Sài Gòn! ♻️';
  }
  if (lower.includes('báo cáo') || lower.includes('ô nhiễm') || lower.includes('bản đồ')) {
    return 'Để báo cáo điểm ô nhiễm, bạn kéo xuống mục "Bản Đồ Kênh Rạch", chọn vị trí, tải hình ảnh và nhấn Gửi. Admin duyệt sẽ tặng bạn +50 điểm thưởng! 📍';
  }
  if (lower.includes('game') || lower.includes('chơi') || lower.includes('trắc nghiệm') || lower.includes('điểm')) {
    return 'Bạn có thể tham gia "Trắc Nghiệm Xanh" (20 câu hỏi) hoặc chơi "Game Pixel Sài Gòn Xanh" để vớt rác tích điểm vinh danh trên Bảng Xếp Hạng! 🎮';
  }
  return 'Chào bạn! Mình là Trợ lý AI của AquaGreen Sài Gòn. Bạn có thể hỏi mình về môi trường, cách báo cáo kênh ô nhiễm trên bản đồ (+50đ) hoặc các trò chơi trên website nhé! 🌱';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Tin nhắn không được để trống' });

  const apiKey = process.env.GEMINI_API_KEY;
  const systemInstruction = "Bạn là Trợ lý AI của dự án môi trường AquaGreen Sài Gòn. Trả lời trực tiếp bằng tiếng Việt, thân thiện, ngắn gọn 2-4 câu. TUYỆT ĐỐI KHÔNG xuất ra các ghi chú suy nghĩ, phân tích đề bài hay tiếng Anh. Trả lời mọi câu hỏi (toán học, kiến thức, môi trường) và khéo léo kết nối với các tính năng của AquaGreen.";

  if (apiKey) {
    try {
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

      for (let i = 0; i < workingModels.length; i++) {
        const idx = (currentModelIndex + i) % workingModels.length;
        const modelName = workingModels[idx];

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: 'user', parts: [{ text: message }] }],
            generationConfig: {
              maxOutputTokens: 250,
              temperature: 0.7,
              // Tắt chế độ suy nghĩ ngầm để phản hồi siêu tốc (<1s)
              thinkingConfig: { thinkingBudget: 0 }
            }
          })
        });

        const data = await response.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        
        // Lọc lấy phần text trả lời thực tế, bỏ qua phần thought nháp
        const answerPart = parts.find(p => !p.thought) || parts[parts.length - 1];
        const reply = answerPart?.text;

        if (response.ok && reply) {
          currentModelIndex = idx;
          return res.status(200).json({ reply });
        }
      }
    } catch (err) {}
  }

  return res.status(200).json({ reply: smartLocalAssistant(message) });
}
