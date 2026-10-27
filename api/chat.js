// api/chat.js - Vercel Serverless Function for AquaGreen Gemini AI Assistant

module.exports = async function handler(req, res) {
    // Enable CORS for web client
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Vui lòng gửi yêu cầu POST.' });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) {}
        }
        const message = body && body.message ? String(body.message).trim() : '';
        const history = Array.isArray(body && body.history) ? body.history : [];

        if (!message) {
            return res.status(400).json({ error: 'Tin nhắn không được để trống.' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(200).json({
                reply: "Chào bạn! Tôi là Trợ lý ảo AI của AquaGreen Sài Gòn 🌿. Hiện tại biến môi trường GEMINI_API_KEY chưa được cấu hình trên Vercel. Bạn hãy vào Vercel Dashboard -> Settings -> Environment Variables, thêm biến GEMINI_API_KEY với khóa Google AI Studio để kích hoạt trò chuyện trực tiếp cùng Gemini nhé!"
            });
        }

        // Cài đặt hệ thống (System Prompt) theo đúng yêu cầu
        const systemInstructionText = "Bạn là Trợ lý ảo AI của AquaGreen Sài Gòn. Nhiệm vụ của bạn là giải đáp thân thiện, tích cực bằng tiếng Việt về phân loại rác (hữu cơ, vô cơ, tái chế) và bảo vệ nguồn nước. Hướng dẫn người dùng sử dụng web: Gửi báo cáo kênh ô nhiễm chờ Admin duyệt (+50đ), chơi Trắc nghiệm môi trường 20 câu, và chơi Game Pixel nhặt rác nhận điểm thưởng. Trả lời súc tích, ngắn gọn tối đa 3-4 câu.";

        // Chuẩn bị nội dung gửi đến Gemini API
        const contents = [];

        // Lấy tối đa 8 tin nhắn gần nhất để duy trì ngữ cảnh
        const recentHistory = history.slice(-8);
        for (const item of recentHistory) {
            if (item && item.text && (item.role === 'user' || item.role === 'model')) {
                contents.push({
                    role: item.role,
                    parts: [{ text: String(item.text) }]
                });
            }
        }

        // Thêm câu hỏi hiện tại của người dùng
        contents.push({
            role: "user",
            parts: [{ text: message }]
        });

        // Gọi Google Gemini REST API (gemini-1.5-flash)
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const payload = {
            system_instruction: {
                parts: [{ text: systemInstructionText }]
            },
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 350
            }
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini API Error:', data);
            const errDetail = (data && data.error && data.error.message) || 'Lỗi kết nối Gemini API';
            return res.status(200).json({
                reply: `Xin lỗi bạn, dịch vụ Gemini AI tạm thời gặp gián đoạn (${errDetail}). Bạn vui lòng thử lại sau giây lát nhé!`
            });
        }

        let botReply = '';
        if (
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts &&
            data.candidates[0].content.parts[0]
        ) {
            botReply = data.candidates[0].content.parts[0].text;
        }

        if (!botReply) {
            botReply = "AquaGreen AI đã nhận được câu hỏi nhưng chưa thể tạo câu trả lời phù hợp. Bạn hãy thử đặt lại câu hỏi ngắn hơn nhé!";
        }

        return res.status(200).json({ reply: botReply.trim() });
    } catch (err) {
        console.error('Serverless Handler Error:', err);
        return res.status(200).json({
            reply: `Xin lỗi bạn, đã có lỗi xử lý xảy ra: ${err.message || 'Lỗi không xác định'}. Vui lòng thử lại sau!`
        });
    }
};

module.exports.default = module.exports;
