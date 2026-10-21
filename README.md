# 🌱 AquaGreen Sài Gòn - Hành Trình Giải Cứu Kênh Rạch & Dòng Nước

Chiến dịch cộng đồng vì môi trường nước xanh - kết nối người dân Thành phố Hồ Chí Minh cùng hành động bảo vệ kênh rạch, giảm thiểu rác thải nhựa đại dương.

---

## 🌟 Tính Năng Nổi Bật

1. **Bản Đồ Điểm Nóng Rác Thải (Interactive Leaflet Map):**
   - Định vị trực quan các điểm nóng rác thải, kênh rạch ô nhiễm trên địa bàn TP.HCM (Quận Bình Thạnh, Gò Vấp, Quận 8, Tân Bình, TP. Thủ Đức, Cần Giờ,...).
   - Tích hợp 2 chế độ bản đồ: Đường phố và Ảnh vệ tinh Esri.
   - Cho phép người dân trực tiếp ghim tọa độ và báo cáo điểm rác mới lên hệ thống bản đồ số.
   - Đồng bộ dữ liệu đa người dùng theo thời gian thực qua **Google Cloud Firestore**.

2. **Infographic Vòng Đời Rác Thải Nhựa:**
   - Minh họa thời gian phân hủy tự nhiên của các loại rác thải phổ biến: Lưới ma (600 năm), Chai nhựa PET (450 năm), Túi nilon (500 năm), Ống hút (200 năm), Đầu lọc thuốc lá (12 năm), Hộp xốp Styrofoam (500+ năm).
   - Phân tích chi tiết mức độ tác hại sinh thái và nguy cơ vi nhựa.

3. **Mini-Game Tương Tác: Chiến Binh Sài Gòn Xanh Vượt Kênh Vớt Rác:**
   - Điều khiển xuồng vớt rác trên dòng kênh bằng cảm ứng ngón tay hoặc bàn phím (WASD / Mũi tên).
   - Thu gom chai nhựa, túi nilon, hộp xốp và né tránh chướng ngại vật nổi để tích lũy điểm thưởng.

4. **Quiz 20 Câu Hỏi Kiến Thức Môi Trường & Thử Thách 7 Ngày Sống Xanh:**
   - Bộ 20 câu hỏi tương tác kiểm tra kiến thức về rác thải nhựa, hệ sinh thái nước ngọt và bảo vệ nguồn nước ngầm.
   - Lộ trình 7 ngày hành động thiết thực giải cứu dòng nước sinh hoạt.

5. **Bảng Xếp Hạng Chiến Binh & Đăng Ký Tình Nguyện Viên:**
   - Bảng vàng thành tích vinh danh cá nhân và tập thể đóng góp nhiều điểm nhất.
   - Biểu mẫu đăng ký tham gia các chiến dịch ra quân nhặt rác dọn kênh rạch cuối tuần.

6. **Tích Hợp Chatbot Trợ Lý Ảo Coze AI:**
   - Trợ lý **AquaGreen Assistant** luôn sẵn sàng giải đáp thắc mắc về phân loại rác, bảo vệ nguồn nước và hướng dẫn tham gia chiến dịch 24/7.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** HTML5, Tailwind CSS, Font Awesome 6, Canvas Confetti.
- **Bản Đồ Số:** Leaflet.js, Esri World Imagery & Street Tiles (miễn phí 100%, không phụ thuộc API key).
- **Cơ Sở Dữ Liệu & Điện Toán Đám Mây:** Google Firebase v10.8 (Cloud Firestore & Firebase Analytics).
- **Trí Tuệ Nhân Tạo (AI Chatbot):** Coze Web SDK.

---

## 🚀 Hướng Dẫn Chạy Cục Bộ

1. Clone mã nguồn về máy:
   ```bash
   git clone https://github.com/nguyenvanmanh7773-alt/AquaGreen.git
   cd AquaGreen
   ```

2. Mở trực tiếp file `index.html` trên trình duyệt bất kỳ hoặc sử dụng Live Server / VS Code.

---

## 🌐 Triển Khai (Deploy)

Dự án là Single Page Application tĩnh (Static Web), có thể triển khai tức thì lên **Vercel**, **GitHub Pages**, hoặc **Firebase Hosting**:
- **Vercel:** Đã bao gồm cấu hình tối ưu tại `vercel.json`. Chỉ cần import kho lưu trữ GitHub và nhấn Deploy.
- **GitHub Pages:** Vào mục Settings -> Pages -> Chọn nhánh `main` và thư mục `/ (root)`.
