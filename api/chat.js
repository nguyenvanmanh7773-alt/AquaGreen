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

        const apiKey = (process.env.GEMINI_API_KEY || '').trim();
        if (!apiKey) {
            return res.status(200).json({
                reply: "Chào bạn! Tôi là Trợ lý ảo AI của AquaGreen Sài Gòn 🌿. Hiện tại biến môi trường GEMINI_API_KEY chưa được cấu hình trên Vercel. Bạn hãy vào Vercel Dashboard -> Settings -> Environment Variables, thêm biến GEMINI_API_KEY với khóa Google AI Studio để kích hoạt trò chuyện trực tiếp cùng Gemini nhé!"
            });
        }

        // Cài đặt hệ thống (System Prompt) chuẩn hóa
        const systemPrompt = "Bạn là Trợ lý ảo AI của AquaGreen Sài Gòn. Nhiệm vụ của bạn là giải đáp thân thiện, tích cực bằng tiếng Việt về phân loại rác (hữu cơ, vô cơ, tái chế) và bảo vệ nguồn nước. Hướng dẫn người dùng sử dụng web: Gửi báo cáo kênh ô nhiễm chờ Admin duyệt (+50đ), chơi Trắc nghiệm môi trường 20 câu, và chơi Game Pixel nhặt rác nhận điểm thưởng. Trả lời súc tích, ngắn gọn tối đa 3-4 câu.";

        // Chuẩn bị lịch sử hội thoại gần nhất
        let conversationContext = '';
        if (history && history.length > 0) {
            const recent = history.slice(-6);
            conversationContext = recent
                .filter(item => item && item.text)
                .map(item => `${item.role === 'user' ? 'Người dùng' : 'Trợ lý AI'}: ${item.text}`)
                .join('\n') + '\n';
        }

        // Tạo cấu trúc promptText hoàn chỉnh
        const promptText = `HƯỚNG DẪN HỆ THỐNG:\n${systemPrompt}\n\n${conversationContext}Người dùng: ${message}\nTrợ lý AI:`;

        // Cấu trúc payload chuẩn REST API
        const payload = {
            contents: [
                {
                    parts: [
                        {
                            text: promptText
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 350
            }
        };

        // 1. Danh sách model dự phòng theo thứ tự ưu tiên:
        // ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-8b"]
        const candidateModels = [
            "gemini-1.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash-8b"
        ];

        let botReply = '';
        let lastErrorMsg = '';

        // 2 & 3. Thử lần lượt các model. Nếu gặp lỗi quá tải (503 / High demand) hoặc lỗi tạm thời,
        // tự động chuyển sang model tiếp theo. Thực hiện thêm 1 lần thử lại (retry) nếu tất cả đều bận.
        outerRetryLoop:
        for (let attempt = 1; attempt <= 2; attempt++) {
            for (const model of candidateModels) {
                try {
                    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    const data = await response.json();

                    if (response.ok && data && data.candidates && data.candidates[0] && data.candidates[0].content) {
                        const parts = data.candidates[0].content.parts;
                        if (parts && parts[0] && parts[0].text) {
                            botReply = parts[0].text.trim();
                            break outerRetryLoop; // Thành công, thoát toàn bộ vòng lặp
                        }
                    } else {
                        const status = response.status;
                        const errMsg = (data && data.error && data.error.message) || `HTTP ${status}`;
                        console.warn(`[Lần ${attempt}] Model ${model} tạm thời bận/lỗi (${errMsg}), chuyển sang model tiếp theo...`);
                        lastErrorMsg = errMsg;
                    }
                } catch (err) {
                    console.warn(`[Lần ${attempt}] Lỗi kết nối tới model ${model}:`, err.message);
                    lastErrorMsg = err.message;
                }
            }

            // Nếu lượt 1 thất bại do quá tải, chờ 600ms trước khi thực hiện lần retry lượt 2
            if (!botReply && attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 600));
            }
        }

        // Nếu tất cả các model đều bận sau lần thử lại (retry), trả về thông báo thân thiện
        if (!botReply) {
            return res.status(200).json({
                reply: `Hệ thống AI hiện đang trong tình trạng quá tải (High demand / ${lastErrorMsg || '503'}). Các máy chủ phản hồi tạm thời bận. Bạn vui lòng gửi lại câu hỏi sau ít giây nhé! 🌿`
            });
        }

        return res.status(200).json({ reply: botReply });
    } catch (err) {
        console.error('Serverless Handler Error:', err);
        return res.status(200).json({
            reply: `Xin lỗi bạn, đã có lỗi xử lý xảy ra: ${err.message || 'Lỗi không xác định'}. Vui lòng thử lại sau!`
        });
    }
};

module.exports.default = module.exports;
