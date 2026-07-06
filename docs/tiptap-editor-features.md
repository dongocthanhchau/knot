# TÀI LIỆU KIẾN TRÚC: NÂNG CẤP TIPTAP THÀNH TRÌNH SOẠN THẢO CHUẨN WORD/EXCEL

**Mục tiêu:** Xây dựng một trình soạn thảo trên nền tảng Next.js + TipTap, đáp ứng các tiêu chuẩn khắt khe về định dạng của giáo trình học thuật, xử lý mượt mà các bảng biểu số liệu phức tạp và quản lý sơ đồ/hình ảnh có cấu trúc.

## I. Nguyên lý kiến trúc cốt lõi
Để thoát khỏi sự lộn xộn của HTML thuần trong TipTap, hệ thống cần áp dụng nguyên lý: **Mọi thành phần phức tạp đều phải là một `ReactNodeView`**.
Thay vì để TipTap quản lý DOM, TipTap chỉ đóng vai trò lưu trữ trạng thái (JSON State). Việc hiển thị và tương tác (nhập liệu bảng, kéo thả ảnh) sẽ do các React Component độc lập đảm nhiệm.

---

## II. Lộ trình triển khai & Tính năng chi tiết

### Giai đoạn 1: Trải nghiệm chuẩn Microsoft Word (Bố cục & Định dạng)
Tạo ra một không gian soạn thảo có giới hạn vật lý rõ ràng, giúp người viết hình dung chính xác bản in cuối cùng.

* **Giao diện mô phỏng trang A4 (Page Layout):**
    * Bọc `<EditorContent>` trong một container có kích thước cố định (VD: `max-width: 21cm`, `padding: 2cm 3cm`).
    * Giới hạn các tùy chọn font chữ (chỉ cho phép Times New Roman, Arial) để đảm bảo tính đồng nhất của giáo trình.
* **Hệ thống Heading & Phân cấp mục lục:**
    * Ghi đè extension `Heading` của TipTap.
    * Tự động map (gắn xạ): H1 = Tên Bài, H2 = Mục I, II, III, H3 = Mục 1, 2, 3.
    * Xây dựng một Component bên ngoài (Table of Contents) tự động quét các Heading trong JSON state để tạo mục lục theo thời gian thực.
* **Định dạng văn bản kỹ thuật (Technical Typography):**
    * Kích hoạt đầy đủ các extension: `Subscript`, `Superscript` (cực kỳ quan trọng để viết các ký hiệu như $V_{in}, R_1, C_2$).
    * Tích hợp `TextAlign` và `LineHeight` (đặt mặc định 1.15 hoặc 1.5).

### Giai đoạn 2: Trải nghiệm chuẩn Google Sheets (Bảng biểu số liệu)
Đây là trái tim của các tài liệu kỹ thuật. Bảng HTML mặc định của TipTap không thể xử lý tốt các bảng đo lường phân áp, bảng ghi nhận dạng sóng hay tính toán sai số.

* **Vô hiệu hóa TipTap Table mặc định:** Xóa bỏ hoàn toàn extension `Table` cơ bản.
* **Xây dựng `DataSheet NodeView` (Custom Component):**
    * Tạo một TipTap Node mới, render ra một bảng tính sử dụng thư viện **Handsontable** hoặc **AG Grid** bên trong React.
    * **Tính năng:** Trải nghiệm gõ phím, di chuyển bằng mũi tên, copy/paste từ Excel vào Web mượt mà 100%.
    * **Cấu trúc dữ liệu:** TipTap chỉ lưu lại mảng 2 chiều (2D Array) cấu trúc của bảng. 
* **Tích hợp Auto-Calculation (Tùy chọn nâng cao):**
    * Cho phép thiết lập công thức ngay trong NodeView. Ví dụ: Cột *Sai số (%)* tự động tính toán dựa trên cột *Giá trị lý thuyết* và *Giá trị đo lường*.

### Giai đoạn 3: Quản lý Media có cấu trúc (Hình ảnh & Sơ đồ mạch)
Chấm dứt tình trạng hình ảnh và chú thích bị rớt dòng hoặc lệch nhau khi xuất file.

* **Xây dựng `Figure NodeView`:**
    * Cấu trúc gồm 1 khung chứa ảnh (`<img>`) và 1 ô nhập liệu Text bên dưới (`<figcaption>`) bị khóa cứng vào nhau.
    * Di chuyển ảnh thì caption bắt buộc đi theo. Không cho phép gõ văn bản thường chèn ngang giữa ảnh và caption.
* **Tích hợp Image Editor Modal (Crop/Resize):**
    * Khi click đúp vào sơ đồ mạch điện hoặc ảnh dạng sóng Oscilloscope, mở ra một cửa sổ pop-up (Modal) che toàn màn hình.
    * Sử dụng `react-image-crop` trong Modal để cắt xén ảnh chuẩn xác. Lưu lại cấu hình crop vào JSON state của Node đó.

### Giai đoạn 4: Mở rộng cho Khối Kỹ thuật (Công thức Toán học)
Giáo trình cần trình bày các công thức tính toán độ lợi, tần số cắt một cách chuyên nghiệp.

* **Tích hợp thư viện Toán học:** Sử dụng extension `tiptap-extension-math` (dựa trên KaTeX/MathJax).
* **Cách thức:** Gõ cú pháp LaTeX vào văn bản, TipTap sẽ render ngay lập tức thành công thức chuẩn. Ví dụ: $f_c = \frac{1}{2\pi R_1 C_1}$.

---

## III. Luồng Xuất bản (Export Engine)
Vì toàn bộ nội dung (Heading, Figure, DataSheet) đã được cấu trúc hóa dưới dạng JSON chặt chẽ, việc xuất file sẽ diễn ra ở Server-side (Next.js API).

1.  **Thu thập dữ liệu:** Nút "Xuất Giáo trình" sẽ gom JSON của toàn bộ các "Bài" lại.
2.  **Bộ biên dịch (Parser):** Xây dựng một hàm đọc JSON của TipTap.
3.  **Xuất Microsoft Word (.docx):**
    * Sử dụng thư viện `docx` (npm).
    * Map `DataSheet Node` thành `Table` của Word.
    * Map `Figure Node` thành `ImageRun` kèm `Paragraph` caption bên dưới.
4.  **Xuất PDF (.pdf):**
    * Sử dụng thư viện `@react-pdf/renderer`.
    * Tận dụng thuộc tính `break` để đảm bảo các sơ đồ nguyên lý hoặc bảng số liệu không bị cắt đôi giữa 2 trang.