Tôi đã đọc toàn bộ PDF. Vấn đề chính của tài liệu này đúng như bạn nói: **nó trộn lẫn “phải làm gì”, “khái niệm”, “evidence phải lưu”, “AI requirement”, “cách nộp bài” vào cùng một mạch**, nên nếu chưa học Software Testing thì rất khó nhìn ra thứ tự thực sự.

Điều quan trọng nhất là: **đừng đọc PDF từ trang 1 → 9 rồi làm theo tuần tự**; phần workflow thực tế chủ yếu nằm ở **Section 5–6, trang 3–6**, còn các section khác chủ yếu cung cấp context, quy định và deliverables.

---

# 1. Trước tiên: bài này thực chất bắt bạn làm gì?

Bạn sẽ lấy một hệ thống e-commerce có sẵn tên là **EShop**, chọn một **end-to-end workflow** đi qua 3 nhóm API, rồi dùng **JMeter hoặc k6** để chạy 3 kiểu Performance Test:

**Load → Stress → Spike → thêm một Endurance/Soak test ngắn → phân tích kết quả bằng AI → review AI → đề xuất Continuous Performance Testing.**

Ví dụ workflow mà chính PDF đưa ra:

> Login → Browse/Search Product → Add to Cart → Checkout.

Workflow này phải chứa cả:

- **Auth-heavy**: login/authentication.
- **Read-heavy**: xem/tìm sản phẩm.
- **Transactional**: add-to-cart/checkout.

---

# 2. Các khái niệm bạn phải biết trước khi nhìn workflow

Tôi chỉ giải thích những thứ trực tiếp xuất hiện trong bài.

### SUT — System Under Test

**SUT = hệ thống bạn đang đem ra test.**

Trong bài này:

**SUT = EShop**, một ứng dụng e-commerce demo có REST backend API.

---

### Endpoint / API Endpoint

Một **endpoint** có thể hiểu đơn giản là một “địa chỉ API” để thực hiện một chức năng.

Ví dụ về mặt ý tưởng:

```text
POST /login
GET /products
POST /cart
POST /checkout
```

PDF không cho endpoint cụ thể mà yêu cầu bạn xem repository để xác định endpoint và port chính xác.

---

### Workflow

**Workflow = chuỗi hành động mô phỏng một người dùng thật.**

Ví dụ:

```text
Login
  ↓
Search Product
  ↓
View Product
  ↓
Add to Cart
  ↓
Checkout
```

Bạn không test mỗi API độc lập rồi ghép kết quả lại; PDF yêu cầu cả ba Test Plan phải chạy **cùng một end-to-end workflow**.

---

### Performance Testing

Performance Testing là kiểm tra:

> “Khi hệ thống phải phục vụ nhiều request/người dùng thì nó còn chạy nhanh, ổn định và chịu tải được tới đâu?”

Bài này dùng 4 biến thể chính.

**Load Test:** tạo mức tải dự kiến hoặc tương đối bình thường để xem hệ thống hoạt động thế nào.

**Stress Test:** tăng tải mạnh để tìm giới hạn hoặc điểm mà hệ thống bắt đầu xuống cấp.

**Spike Test:** tăng tải đột ngột để xem hệ thống phản ứng với cú tăng traffic bất ngờ ra sao.

**Endurance / Soak Test:** giữ một mức tải liên tục trong một khoảng thời gian để xem hệ thống có ổn định lâu dài không.

PDF yêu cầu 3 Test Plan Load/Stress/Spike và thêm một soak test khoảng **10–15 phút** để tìm threshold trên chính hardware của bạn.

---

### Test Plan

Trong bài này có thể hiểu:

> **Test Plan = file/cấu hình mô tả JMeter/k6 sẽ giả lập người dùng như thế nào và gửi request nào.**

Ví dụ Test Plan có thể chứa:

```text
100 virtual users
↓
Login
↓
wait 2 seconds
↓
Search Product
↓
wait 1 second
↓
Add to Cart
↓
Checkout
```

Bạn phải có **3 Test Plan khác nhau**:

```text
Load Test Plan
Stress Test Plan
Spike Test Plan
```

nhưng cả ba chạy **cùng workflow**.

---

### Virtual User / Thread

Đây là **người dùng giả lập** do công cụ tạo ra.

Ví dụ:

```text
1 thread ≈ 1 simulated user
100 threads ≈ 100 users đang thực hiện workflow
```

PDF yêu cầu AI hỗ trợ bạn lựa chọn thread/virtual-user counts.

---

### Ramp-up

Ramp-up là:

> **Khoảng thời gian để tăng từ 0 user lên số user mục tiêu.**

Ví dụ:

```text
100 users
Ramp-up = 20 seconds
```

nghĩa là không thả 100 user cùng lúc, mà tăng dần lên trong 20 giây.

PDF đặc biệt yêu cầu bạn review AI xem ramp-up có realistic hay không.

---

### Think-time

Think-time mô phỏng khoảng thời gian người thật “nghĩ” giữa hai hành động.

Ví dụ:

```text
Search Product
↓
wait 2 seconds
↓
View Product
```

Nếu không có think-time, virtual user có thể spam API nhanh hơn nhiều so với user thật.

PDF cũng yêu cầu AI hỗ trợ lựa chọn think-time và bạn phải review lại.

---

### CSV

**CSV = file dữ liệu dạng bảng đơn giản**, thường giống:

```csv
username,password,productId
user01,password01,15
user02,password02,24
user03,password03,31
```

Mục đích của CSV trong bài này là để mỗi virtual user không nhất thiết gửi cùng một dữ liệu.

Ví dụ:

```text
Virtual User 1
→ login user01
→ mua product 15

Virtual User 2
→ login user02
→ mua product 24
```

PDF bắt buộc workflow phải **data-driven bằng CSV**, ví dụ credentials, product IDs hoặc order payload.

---

### Listener / Report View

Đây là cách JMeter **hiển thị kết quả test**.

PDF ví dụ:

- View Results Tree
- Summary Report
- Aggregate Report

Và yêu cầu **3 Test Plan phải dùng 3 loại report khác nhau, không được lặp lại**.

---

### `.jtl`

`.jtl` là **raw result log do JMeter tạo ra**.

Bạn có thể hiểu nó là:

> “Dữ liệu gốc của mỗi request trong lần chạy test.”

Sau này bạn sẽ đưa `.jtl` cho AI phân tích và dùng chính `.jtl` để kiểm tra xem AI đọc metric đúng hay sai.

PDF bắt buộc giữ raw `.jtl`, không chỉ giữ screenshot hoặc summary.

---

### RPS

**RPS = Requests Per Second**, tức số request hệ thống xử lý trong một giây.

Ví dụ:

```text
500 RPS
```

≈ hệ thống đang xử lý khoảng 500 request/giây.

PDF dùng **maximum stable RPS** làm ví dụ cho một hardware threshold bạn có thể tìm.

---

### p95

p95 latency có thể hiểu như sau:

> **95% request có response time nhỏ hơn hoặc bằng giá trị này.**

Ví dụ:

```text
p95 = 800 ms
```

nghĩa là khoảng 95% request hoàn thành trong tối đa 800 ms.

Khái niệm này xuất hiện ở Task 3 khi bạn phải đề xuất hệ thống phát hiện **p95 regression**.

---

# 3. Working flow thực sự bạn nên đi theo

Tôi sẽ tuân đúng yêu cầu của bạn:

> **Mỗi step chỉ có đúng một câu mô tả.**

Tôi thêm vị trí PDF ngay bên cạnh để bạn biết nó xuất phát từ đâu.

---

## Phase A — Hiểu hệ thống

### Step 1 — Đọc SUT

**Clone/chạy EShop và xác định frontend/backend/API của hệ thống hoạt động như thế nào.**

→ PDF: **Section 4 — System Under Test, trang 2–3.**

---

### Step 2 — Xác định API

**Từ repository, xác định endpoint và port thật tương ứng với các chức năng bạn muốn test.**

→ PDF: **Section 4, cuối trang 3.**

---

## Phase B — Chọn thứ mình sẽ test

### Step 3 — Chọn workflow

**Chọn một end-to-end workflow duy nhất có đủ Auth-heavy → Read-heavy → Transactional và không trùng workflow với thành viên khác.**

→ PDF: **Section 5 — Scope, trang 4 + Task 1 trang 4.**

Ví dụ:

```text
Login
↓
Search Product
↓
Product Detail
↓
Add to Cart
↓
Checkout
```

---

## Phase C — Chuẩn bị dữ liệu

### Step 4 — Tạo CSV

**Tạo CSV chứa dữ liệu thay đổi giữa các virtual user như username/password, productId hoặc order payload.**

→ PDF: **Task 1 — Make the workflow data-driven, trang 4.**

Ví dụ:

```csv
username,password,productId
user01,pass01,12
user02,pass02,19
user03,pass03,27
```

---

## Phase D — Thiết kế test

Đây là chỗ **Test Plan** chính thức xuất hiện.

### Step 5 — Tạo Load Test Plan

**Dùng AI từng bước để thiết kế Load Test Plan cho workflow đã chọn với virtual users, ramp-up và think-time phù hợp.**

→ PDF: **Task 1 — Design and generate with AI, trang 4.**

---

### Step 6 — Tạo Stress Test Plan

**Từ cùng workflow đó, tạo Stress Test Plan với mức tải nhằm đẩy hệ thống về phía giới hạn chịu tải.**

→ PDF: **Task 1, trang 4.**

---

### Step 7 — Tạo Spike Test Plan

**Từ cùng workflow đó, tạo Spike Test Plan mô phỏng việc số lượng virtual user tăng đột ngột.**

→ PDF: **Task 1, trang 4.**

---

### Step 8 — Gắn CSV vào Test Plans

**Cấu hình cả workflow để các request lấy credentials/product/order data từ CSV thay vì hard-code dữ liệu cố định.**

→ PDF: **Task 1 — Make the workflow data-driven, trang 4.**

---

### Step 9 — Chọn report view

**Gán một Listener/Report View khác nhau cho Load, Stress và Spike để ba Test Plan không dùng trùng loại report.**

→ PDF: **Task 1 — Use three different report views, trang 4.**

Ví dụ:

```text
Load
→ Summary Report

Stress
→ Aggregate Report

Spike
→ View Results Tree
```

---

### Step 10 — Đặt tên Test Plans

**Đặt tên ba Test Plan theo format `{StudentID}_{ScenarioType}_{YYYYMMDD}`.**

→ PDF: **Task 1, cuối trang 4.**

---

# Phase E — Human Review

Đây là phần cực quan trọng vì assignment **không chấp nhận AI generate xong rồi chạy luôn**.

### Step 11 — Review AI

**Tự kiểm tra và sửa Test Plan do AI tạo, đặc biệt ở ramp-up, think-time, thread count, assertions và account-lockout handling.**

→ PDF: **Task 1 — Review and fix, trang 5.**

---

### Step 12 — Ghi lại lỗi của AI

**Trong report, ghi AI đã làm sai/thiếu gì, bạn sửa thế nào và vì sao AI có thể mắc lỗi đó.**

→ PDF: **Task 1 — Review and fix, trang 5.**

---

# Phase F — Chạy Performance Test

### Step 13 — Chuẩn bị monitoring

**Mở JMeter/k6 cùng Task Manager, htop hoặc Activity Monitor để quan sát đồng thời test metrics và resource usage của backend.**

→ PDF: **Task 1 — Run with evidence, trang 5.**

---

### Step 14 — Chạy Load Test

**Chạy Load Test và lưu screenshot, raw `.jtl`, HTML report cùng resource usage trong thời gian test.**

→ PDF: **Task 1 — Run as completely as possible, trang 5.**

---

### Step 15 — Chạy Stress Test

**Chạy Stress Test và lưu cùng loại execution evidence để xác định khi nào hệ thống bắt đầu xuống cấp hoặc lỗi.**

→ PDF: **Task 1 — Run as completely as possible, trang 5.**

---

### Step 16 — Chạy Spike Test

**Chạy Spike Test và lưu evidence để quan sát hệ thống phản ứng khi tải tăng đột ngột.**

→ PDF: **Task 1 — Run as completely as possible, trang 5.**

---

### Step 17 — Reset account lockout khi cần

**Nếu Stress hoặc Spike làm login thất bại ba lần và khóa account thì reset account trước lần chạy tiếp theo rồi ghi lại cách reset.**

→ PDF: **Task 1, trang 5.**

---

# Phase G — Tìm giới hạn máy

### Step 18 — Chạy Endurance/Soak Test

**Giữ một mức tải liên tục khoảng 10–15 phút để quan sát khả năng duy trì performance của hệ thống trên hardware của bạn.**

→ PDF: **Task 1 — Determine endurance threshold, trang 5.**

---

### Step 19 — Xác định threshold

**Từ kết quả soak test, ghi ra threshold bằng số cụ thể như maximum stable RPS hoặc memory ceiling.**

→ PDF: **Task 1 — Determine endurance threshold, trang 5.**

---

# Phase H — Ghi evidence

### Step 20 — Lưu hardware evidence

**Chụp hardware report bằng dxdiag/screenfetch và tạo bảng thông số máy để kết quả performance có hardware context.**

→ PDF: **Task 1 — Run with evidence, trang 5.**

---

### Step 21 — Quay demo video

**Quay ít nhất sáu phút video có testing tool và resource monitor cùng khung hình kèm thuyết minh tiếng Việt của bạn.**

→ PDF: **Task 1 — Record a demo video, trang 5.**

---

### Step 22 — Tạo GitHub Issue nếu có lỗi thật

**Nếu test phát hiện crash, error response hoặc functional/performance issue thật thì tạo GitHub Issue kèm screenshot.**

→ PDF: **Task 1 — Report issues, trang 5.**

---

# Phase I — AI phân tích kết quả

Đây mới là **Task 2**.

### Step 23 — Đưa raw `.jtl` cho AI

**Sau khi có raw results, đưa `.jtl` cho AI phân tích performance metrics và đề xuất performance thresholds.**

→ PDF: **Task 2 — Analyse with AI, trang 5.**

---

### Step 24 — So sánh AI với raw log

**Đối chiếu từng nhận xét quan trọng của AI với giá trị thật trong `.jtl` để tìm các metric mà AI đọc hoặc diễn giải sai.**

→ PDF: **Task 2 — Review and correct, trang 5.**

---

### Step 25 — Ghi AI misinterpretation

**Với mỗi chỗ AI sai, ghi nhận định sai của AI, giá trị đúng lấy từ `.jtl` và giải thích vì sao nhận định đó sai.**

→ PDF: **Task 2 — Review and correct, trang 5.**

---

### Step 26 — Yêu cầu AI đề xuất optimization

**Yêu cầu AI đề xuất cách cải thiện performance như database index, connection pool hoặc SQLite WAL.**

→ PDF: **Task 2 — Judge AI recommendations, trang 6.**

---

### Step 27 — Review optimization

**Phân loại từng đề xuất optimization của AI thành feasible hoặc hallucinated và giải thích dựa trên SUT thực tế.**

→ PDF: **Task 2 — Judge AI recommendations, trang 6.**

---

# Phase J — Continuous Performance Testing

Đây là **Task 3**.

### Step 28 — Thiết kế Continuous Performance Testing

**Đề xuất một pipeline theo dõi commit của SUT, quyết định khi nào chạy performance test và cảnh báo nếu p95 bị regression.**

→ PDF: **Task 3, trang 6.**

---

### Step 29 — Vẽ flow chart

**Vẽ flow chart thể hiện commit → quyết định chạy test → performance test → so sánh p95 → pass hoặc cảnh báo regression.**

→ PDF: **Task 3, trang 6.**

---

### Step 30 — Phân tích trade-off

**Giải thích trade-off của pipeline như chi phí chạy test và khả năng phát sinh false alarm.**

→ PDF: **Task 3, trang 6.**

---

# Phase K — Documentation

Đây là một điểm PDF bố trí khá tệ: thực chất bạn phải làm nó **xuyên suốt từ Step 1**, chứ không phải cuối bài.

### Step 31 — Ghi AI Audit Log xuyên suốt

**Mỗi lần dùng AI, lưu tên tool, thời gian, prompt và output để cuối cùng tạo AI Audit Report.**

→ PDF: **Section 9 — AI Audit Report, trang 6–7.**

---

### Step 32 — Commit sau mỗi milestone

**Sau mỗi bước quan trọng như tạo Test Plan, AI analysis hoặc Continuous Testing proposal thì tạo một Git commit mới.**

→ PDF: **Section 12 — Git Commit Log, trang 7.**

---

### Step 33 — Viết AI Critique

**Viết 200–300 từ tổng kết AI đã sai/thiếu gì, vì sao nó không phát hiện được và bạn học được nguyên tắc gì khi cộng tác với AI.**

→ PDF: **Section 10 — AI Critique, trang 7.**

---

# Phase L — Đóng gói bài

### Step 34 — Viết Main Report

**Tổng hợp toàn bộ quá trình thiết kế, review, execution, metrics, endurance threshold, AI analysis và critique vào Main Report dạng Markdown và PDF.**

→ PDF: **Section 14 — Submission Regulations, trang 8.**

---

### Step 35 — Viết README

**Tạo README chứa self-assessment, scenario đã chạy, endpoint group, endurance threshold, số issue và demo-video link.**

→ PDF: **Section 14, trang 8.**

---

### Step 36 — Đóng gói ZIP

**Đưa report, Test Plans, CSV/data, `.jtl`, HTML reports, screenshots, AI Audit, critique, Git log và các evidence khác vào ZIP theo đúng filename quy định.**

→ PDF: **Section 14, trang 8.**

---

# 4. Nếu bỏ hết phần “văn phong assignment”, flow của bạn chỉ là thế này

```text
EShop
 │
 ▼
Hiểu API
 │
 ▼
Chọn 1 workflow
 │
 ▼
Login → Search → Add Cart → Checkout
 │
 ▼
Chuẩn bị CSV
 │
 ▼
Tạo 3 Test Plans
 │
 ├── Load
 ├── Stress
 └── Spike
 │
 ▼
Human Review
 │
 ▼
Fix Test Plans
 │
 ▼
Run Tests
 │
 ├── .jtl
 ├── HTML Report
 ├── Screenshot
 └── Resource Monitoring
 │
 ▼
Run Soak Test 10–15 phút
 │
 ▼
Determine Hardware Threshold
 │
 ▼
AI phân tích .jtl
 │
 ▼
Bạn kiểm tra AI
 │
 ▼
AI đề xuất optimization
 │
 ▼
Bạn đánh giá feasible / hallucinated
 │
 ▼
Continuous Performance Testing Proposal
 │
 ▼
Main Report + AI Audit + README + Evidence
 │
 ▼
ZIP → Moodle
```

---

# 5. Điều dễ gây hiểu nhầm nhất trong PDF

Tài liệu làm cảm giác như bạn phải xử lý rất nhiều đầu việc độc lập, nhưng thực chất có **một đường dữ liệu xuyên suốt duy nhất**:

```text
Workflow
   ↓
Test Plan
   ↓
Test execution
   ↓
.jtl raw data
   ↓
Metrics
   ↓
AI analysis
   ↓
Human review
   ↓
Performance conclusion
```

Và song song với nó có một đường **evidence/documentation**:

```text
Mỗi bước
   ↓
AI Audit
Git commit
Screenshot / file / video
   ↓
Main Report
   ↓
Submission ZIP
```

PDF nhấn mạnh toàn bộ quá trình phải được document bằng định dạng text-based như Markdown và bài được chấm không chỉ trên việc “chạy được test”, mà còn trên test plans, data files, raw logs, report views, hardware evidence, video và AI critique.

**Nếu bạn mới hoàn toàn với Software Testing, thứ tự học/làm hợp lý nhất không phải “học Performance Testing trước rồi mới động vào bài”, mà là: `SUT/API → workflow → CSV → JMeter/Test Plan → Load → Stress → Spike → metrics/.jtl → monitoring → AI analysis`; phần Continuous Testing chỉ cần học sau khi đã chạy xong test.**
