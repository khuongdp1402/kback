# KBack — Nền tảng hoàn tiền mua sắm (demo)

Web app cashback/hoàn tiền khi mua sắm qua Shopee, Lazada, Tiki, TikTok Shop và ShopeeFood.
Lấy cảm hứng từ mô hình nghiệp vụ của [Monback](https://monback.app/) nhưng là thương hiệu,
nội dung và mã nguồn hoàn toàn mới.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Prisma 7** + PostgreSQL (driver adapter `@prisma/adapter-pg`)
- **NextAuth v5** (Credentials provider, JWT session)
- Kiến trúc adapter cho tích hợp bên ngoài: `lib/affiliate/*`, `lib/payout/*`

## Bắt đầu nhanh

```bash
npm install
npx prisma migrate dev   # áp schema lên database Postgres trỏ bởi DATABASE_URL trong .env
npm run db:seed          # tạo 5 shop mẫu + 1 tài khoản demo + 1 tài khoản admin
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). Đăng nhập bằng tài khoản demo:

- Người dùng: `demo@cashback.app` / `demo1234`
- Quản trị viên: `admin@kback.app` / `admin1234` (vào `/admin` sau khi đăng nhập)

Toàn bộ luồng nghiệp vụ chạy được ngay mà **không cần bất kỳ API key nào** nhờ các provider mock
mô tả bên dưới. Production hiện chạy tại [kback-app.vercel.app](https://kback-app.vercel.app).

## Kiến trúc tích hợp bên ngoài

Các sàn TMĐT (Shopee/Lazada/Tiki/TikTok Shop) không cấp API affiliate công khai trực tiếp cho
bên thứ ba. Trên thực tế các app cashback tại Việt Nam đều đi qua một **affiliate network trung
gian** (phổ biến nhất là [AccessTrade](https://developers.accesstrade.vn/)) để tạo link tracking
và nhận thông báo hoa hồng. Tương tự, việc chi trả về ví/ngân hàng cần một **cổng thanh toán**
riêng. App này định nghĩa 2 interface adapter để dễ dàng cắm nhà cung cấp thật vào sau:

### `lib/affiliate/` — Affiliate network

| File | Vai trò |
| --- | --- |
| `types.ts` | Interface `AffiliateProvider` (`createDeepLink`, `parseConversionPayload`) |
| `accesstrade.ts` | Tích hợp AccessTrade thật — đã verify hoạt động với API thật (`POST /v1/product_link/create`, header `Authorization: Token <key>`, yêu cầu `campaign_id` theo từng shop) + parser cho postback |
| `mock.ts` | Provider giả lập: sinh link demo + tự tạo giao dịch/hoa hồng giả sau vài giây để demo luồng đầy đủ |
| `index.ts` | Chọn provider theo `AFFILIATE_PROVIDER`; tự fallback sang mock nếu thiếu key |

**Kích hoạt AccessTrade thật**:
1. Đăng ký tài khoản publisher tại AccessTrade (accesstrade.vn → Publisher → Đăng ký), chọn
   **Access Affiliate**.
2. Đăng ký tham gia chiến dịch (campaign) cho từng sàn ở mục "Chiến dịch" → tab "Thương Mại Điện
   Tử" — mỗi sàn là 1 campaign riêng, cần được duyệt (một số tự động duyệt, một số cần xét thủ
   công).
3. Với mỗi campaign đã duyệt (nút chuyển thành "Tạo link ngay"), lấy `campaign_id` từ URL trang
   chi tiết chiến dịch (dạng `campaign-v2/<tên>--<campaign_id>`), điền vào field **"AccessTrade
   Campaign ID"** của Shop tương ứng trong `/admin/shops`.
4. Lấy API key ở mục Cài đặt/API trên dashboard AccessTrade, cập nhật `.env`:

```
AFFILIATE_PROVIDER=accesstrade
ACCESSTRADE_API_KEY=xxxx
LEGAL_COMPLIANCE_CONFIRMED=true   # chỉ sau khi hoàn tất checklist pháp lý bên dưới
```

Cấu hình postback URL bên AccessTrade trỏ về `https://<domain>/api/webhooks/affiliate`. Một shop
chưa có `accessTradeCampaignId` sẽ báo lỗi rõ ràng thay vì tạo link sai khi có người bấm "Mua
ngay" ở chế độ AccessTrade thật.

#### Phương án dự phòng: Shopee Affiliate trực tiếp (`shopee-direct.ts`)

⚠️ **Khung code, chưa test với credentials thật.** AccessTrade đã tạm ngưng duyệt publisher mới
cho chiến dịch Shopee từ 26/5 (không có deadline cụ thể) để rà soát chất lượng traffic toàn
chiến dịch. Trong lúc chờ, `lib/affiliate/shopee-direct.ts` là khung tích hợp thẳng với API
affiliate của chính Shopee (`affiliate.shopee.vn`, độc lập với AccessTrade) — dùng khi cần kênh
Shopee hoạt động ngay mà không phụ thuộc việc AccessTrade mở duyệt lại.

**Kích hoạt**:
1. Đăng ký tại affiliate.shopee.vn (tài khoản Shopee + 1 kênh phân phối, ví dụ chính domain
   `kback-app.vercel.app` — không có yêu cầu follower tối thiểu công khai).
2. Lấy App ID + Secret Key ở mục "Open API" trên dashboard.
3. **Bắt buộc trước khi bật thật**: xác minh lại format ký request (SHA256 signing) bằng công cụ
   [API Explorer](https://open-api.affiliate.shopee.vn/explorer/v2) — format hiện tại trong code
   được suy ra từ tài liệu API các khu vực khác của Shopee, chưa verify với tài khoản Việt Nam
   thật, khả năng cần chỉnh sửa nhỏ (ví dụ thứ tự nối chuỗi khi ký).
4. Cập nhật `.env`:

```
AFFILIATE_PROVIDER=shopee_direct
SHOPEE_AFFILIATE_APP_ID=xxxx
SHOPEE_AFFILIATE_SECRET=xxxx
LEGAL_COMPLIANCE_CONFIRMED=true   # chỉ sau khi hoàn tất checklist pháp lý bên dưới
```

**Khác biệt quan trọng so với AccessTrade**: Shopee không đẩy postback về server — cần một job
định kỳ (cron) gọi Conversion Report API để đối soát giao dịch, thay vì chờ webhook chủ động gọi
tới như AccessTrade. Job này **chưa được viết** — `parseConversionPayload` trong
`shopee-direct.ts` chỉ xử lý format 1 dòng dữ liệu, sẵn sàng để cắm vào khi có job polling.

### `lib/payout/` — Chi trả/rút tiền

| File | Vai trò |
| --- | --- |
| `types.ts` | Interface `PayoutProvider` (`createPayout`, `checkPayoutStatus`) |
| `vietqr.ts` | Khung tích hợp mẫu theo chuẩn phổ biến (client id + api key, tạo transfer, tra cứu trạng thái) |
| `mock.ts` | Provider giả lập: chuyển trạng thái PENDING → PROCESSING → PAID tự động |
| `index.ts` | Chọn provider theo `PAYOUT_PROVIDER`; tự fallback sang mock nếu thiếu key |

**Kích hoạt cổng thanh toán thật**: cập nhật `.env`:

```
PAYOUT_PROVIDER=vietqr
VIETQR_CLIENT_ID=xxxx
VIETQR_API_KEY=xxxx
```

Điều chỉnh field/endpoint trong `lib/payout/vietqr.ts` cho khớp đúng hợp đồng của đối tác thanh
toán bạn sử dụng — mã hiện tại là khung mẫu theo chuẩn phổ biến, không phải một cổng cụ thể.

## Data model

Xem `prisma/schema.prisma`: `User`, `Shop`, `Click` (mỗi lần bấm "Mua ngay" hoặc dán link sản
phẩm), `Transaction` (đơn hàng + hoa hồng gốc + hoa hồng đã chia theo hạng), `PayoutRequest`
(yêu cầu rút tiền). Số dư ví được **tính động** trong `lib/wallet.ts`, không lưu trực tiếp trên
`User`.

## Luồng nghiệp vụ

1. Người dùng vào `/shops` — chọn shop có sẵn, hoặc dán link sản phẩm bất kỳ (hệ thống tự nhận
   diện sàn qua `lib/link-detect.ts`) — rồi bấm "Mua ngay" → tạo `Click`, gọi
   `AffiliateProvider.createDeepLink()`, redirect sang link theo dõi (hoặc trang
   `/demo-checkout` khi ở chế độ mock).
2. Mạng affiliate xác nhận đơn hàng → gọi `POST /api/webhooks/affiliate` (ở chế độ mock, việc
   này được `MockAffiliateProvider` tự mô phỏng bằng `setTimeout`) → tạo/update `Transaction`
   với `baseCashbackAmount` (hoa hồng gốc từ network) và `cashbackAmount` (đã chia theo hạng
   thành viên của người dùng, xem `lib/membership.ts`).
3. Khi `Transaction.status = CONFIRMED`, số dư khả dụng trong ví tăng lên.
4. Người dùng tạo yêu cầu rút tiền tại `/wallet` → `POST /api/payouts` → gọi
   `PayoutProvider.createPayout()` → cập nhật trạng thái `PayoutRequest`.

## Hạng thành viên (`lib/membership.ts`)

Hạng được **tính động theo tổng giá trị đơn hàng đã xác nhận của chính người dùng** (không lưu
cứng, không có referral/mời bạn). Ba hạng: Thành viên (0đ+, 50% hoa hồng gốc) → Bạc (≥5tr, 65%)
→ Vàng (≥20tr, 80%). Đây là ranh giới pháp lý quan trọng — xem mục dưới.

## Quản trị (`/admin`)

Chỉ tài khoản có `role = ADMIN` mới truy cập được — kiểm tra trong `app/admin/layout.tsx` qua
`lib/require-admin.ts`, redirect về `/dashboard` nếu không đủ quyền. API routes tương ứng (`app/api/admin/*`)
cũng tự kiểm tra quyền độc lập, trả `403` nếu gọi trực tiếp bằng tài khoản không phải admin.

| Trang | Chức năng |
| --- | --- |
| `/admin` | Số liệu tổng quan: số user, số shop, giao dịch chờ xác nhận, tổng đã hoàn, yêu cầu rút tiền chờ duyệt |
| `/admin/shops` | Thêm/sửa/xoá shop, điều chỉnh % hoàn tiền từng sàn |
| `/admin/transactions` | Xem toàn bộ giao dịch, đổi trạng thái thủ công (PENDING/CONFIRMED/EXPIRED/REJECTED) — dùng khi tranh chấp hoặc webhook affiliate lỗi |
| `/admin/payouts` | Duyệt/từ chối yêu cầu rút tiền, đánh dấu đã chuyển khoản thủ công |
| `/admin/users` | Xem danh sách người dùng kèm số dư ví, khoá/mở khoá tài khoản (chặn đăng nhập) |

Cấp quyền admin cho một tài khoản: sửa trực tiếp qua `npx prisma studio` (đổi field `role` của
`User` thành `ADMIN`), hoặc thêm logic riêng nếu cần UI cho việc này sau.

## Lệnh hữu ích

```bash
npm run dev        # chạy dev server (Turbopack)
npm run build       # build production
npm run lint        # eslint
npm run db:seed     # seed lại shop mẫu + tài khoản demo
npx prisma studio   # xem/sửa dữ liệu trực quan
```

## Pháp lý & tuân thủ

Mô hình "hoàn tiền theo % đơn hàng thật" là hợp pháp tại Việt Nam — cùng loại với các nền tảng
hoàn tiền quốc tế đang hoạt động hợp pháp. Rủi ro pháp lý không nằm ở việc chia lại hoa hồng cho
người dùng, mà ở **cách kết nối với affiliate network** và **thiếu đăng ký kinh doanh** khi vận
hành với dòng tiền thật. App này được thiết kế để nằm trong ranh giới an toàn:

- Hạng thành viên **chỉ** tính theo chi tiêu của chính người dùng đó — không có referral, không
  có hoa hồng từ đơn hàng người khác, không có nạp tiền/mua gói để lên hạng. Xem comment cảnh báo
  ranh giới này trong `lib/membership.ts` trước khi thêm bất kỳ tính năng liên quan đến mời/giới
  thiệu người dùng.
- Đã có sẵn `/dieu-khoan`, `/chinh-sach-bao-mat`, `/gioi-thieu` — cần điền thông tin pháp nhân
  thật (tên hộ kinh doanh/doanh nghiệp, mã số thuế) trước khi công khai.

**Checklist bắt buộc trước khi chuyển `AFFILIATE_PROVIDER`/`PAYOUT_PROVIDER` sang giá trị thật và
vận hành với người dùng thật, tiền thật:**

1. Đăng ký hộ kinh doanh (mã ngành 7310 — quảng cáo, hoặc 4791 — bán lẻ qua internet).
2. Đăng ký làm **publisher của một affiliate network trung gian** (AccessTrade hoặc tương đương)
   — không dùng tài khoản affiliate cá nhân đăng ký trực tiếp với Shopee, vì điều khoản Shopee
   Affiliate cấm việc chia sẻ lại hoa hồng qua nền tảng trung gian của bên thứ ba (Điều 3.24).
   Khai báo rõ mô hình cashback với network khi đăng ký để được duyệt đúng loại hình.
3. Thông báo website thương mại điện tử với Bộ Công Thương qua
   [online.gov.vn](http://online.gov.vn) (Nghị định 52/2013/NĐ-CP, sửa đổi bởi Nghị định
   85/2021/NĐ-CP).
4. Mở tài khoản ngân hàng doanh nghiệp/hộ kinh doanh riêng cho dòng tiền hoàn — chuyển khoản trực
   tiếp từ tài khoản này không cần giấy phép trung gian thanh toán, miễn là không phát hành "ví
   nội bộ" cho phép chuyển tiền qua lại giữa người dùng.
5. Chuẩn bị nghĩa vụ thuế: cá nhân nhận hoa hồng bị khấu trừ 10% nếu >2 triệu/tháng và chưa đăng
   ký hộ kinh doanh; có hộ kinh doanh thì nộp 7% trên doanh thu (5% VAT + 2% TNCN).

**Khóa an toàn kỹ thuật (`LEGAL_COMPLIANCE_CONFIRMED`):** trong lúc phát triển, chỉ cần để mặc
định `.env` như hiện tại (`AFFILIATE_PROVIDER=mock`, `PAYOUT_PROVIDER=mock`,
`LEGAL_COMPLIANCE_CONFIRMED=false`) — không phát sinh nghĩa vụ pháp lý gì vì không có dòng tiền
hay API thật. `lib/affiliate/index.ts` và `lib/payout/index.ts` **luôn** dùng provider mock nếu
`LEGAL_COMPLIANCE_CONFIRMED` không phải `"true"`, kể cả khi bạn đã điền API key thật vào — đây là
rào chắn để tránh vô tình gọi API thật/chuyển tiền thật trước khi hoàn tất checklist ở trên. Chỉ
đổi thành `"true"` sau khi đã thực sự hoàn tất cả 5 bước.

Chi tiết đầy đủ (bảng so sánh hợp pháp/vi phạm, quy trình đăng ký từng bước, giấy tờ cần chuẩn
bị) đã được tổng hợp riêng — tham khảo lại báo cáo "Pháp Lý Mô Hình Hoàn Tiền" đã gửi. Đây là tài
liệu tham khảo, không thay thế tư vấn từ luật sư/kế toán thuế trước khi vận hành dòng tiền thật.
