# KBack Zalo Mini App

Mini App chạy ngay trong Zalo: khách **mở là dùng, không cần đăng ký** (tự đăng nhập bằng Zalo),
dán link sản phẩm → biết ngay được hoàn bao nhiêu tiền → bấm mua. Có Ví để xem đơn và rút tiền.

Stack: React 18 + [zmp-ui](https://mini.zalo.me/documents/zaui/) + [zmp-sdk](https://mini.zalo.me/documents/api/) + Vite (`zmp-vite-plugin`).
Backend dùng chung với web: các route `/api/zalo/*` trong app Next.js ở thư mục cha.

## Luồng đăng nhập

1. Mini App gọi `authorize({ scopes: ["scope.userInfo"] })` (không bắt buộc, chỉ để lấy tên/ảnh)
   rồi `getAccessToken()`.
2. Gửi token lên `POST /api/zalo/auth` → backend xác thực với `graph.zalo.me/v2.0/me`
   (`lib/zalo/verify-access-token.ts`), tạo tài khoản KBack nếu là lần đầu.
3. Backend trả về bearer token riêng của KBack (`lib/zalo/session.ts`, HMAC bằng `AUTH_SECRET`,
   hạn 30 ngày). Mọi request sau gửi `Authorization: Bearer <token>`.

| Route | Việc |
| --- | --- |
| `POST /api/zalo/auth` | Đổi access token Zalo → token KBack |
| `POST /api/zalo/estimate` | Ước tính hoàn tiền cho 1 link (không tạo click) |
| `POST /api/zalo/paste-link` | Tạo link hoàn tiền + ước tính theo hạng của khách |
| `GET /api/zalo/me` | Ví, hạng, 20 đơn gần nhất, lịch sử rút |
| `POST /api/zalo/payout` | Rút tiền (dùng chung logic với web: `lib/payout/request-payout.ts`) |

## Chạy thử local (ngoài Zalo)

```bash
cd zalo-mini-app
npm install
cp .env.example .env    # VITE_KBACK_API_URL=http://localhost:3000, VITE_ZALO_DEV_MOCK_TOKEN=mock:1:Test
npm run dev
```

Backend (thư mục cha) cần `ZALO_AUTH_MOCK=true` trong `.env` và đã chạy
`npx prisma migrate deploy` (migration `20261126000000_add_zalo_user`).
Chế độ mock bị **tắt cứng khi `NODE_ENV=production`**.

## Đưa lên Zalo

1. Tạo Zalo App tại [developers.zalo.me](https://developers.zalo.me), bật sản phẩm **Mini App**.
   Lấy **App Secret** → điền `ZALO_APP_SECRET` vào `.env` của backend.
2. Trong trang quản lý Mini App: thêm domain backend (vd. `kback-app.vercel.app`) vào danh sách
   **domain được phép gọi API**, nếu không mọi `fetch` sẽ bị chặn.
3. Cài CLI và đăng nhập: `npm i -g zmp-cli` → `zmp login`.
4. `npm run build` → `zmp deploy` (upload thư mục `www/`), chọn bản **Testing** để quét QR thử
   trên điện thoại, sau đó gửi **duyệt** để phát hành.

## ⚠️ Cần kiểm tra với app thật trước khi phát hành

- **Format API `graph.zalo.me/v2.0/me`** (header `access_token`, `appsecret_proof`, cấu trúc
  `picture.data.url`) được viết theo tài liệu công khai, **chưa test với token thật**. Thử một
  lần với bản Testing; nếu Zalo trả khác, chỉ cần sửa `lib/zalo/verify-access-token.ts`.
- `openOutApp` (nút "Mở bằng ứng dụng sàn") có trong type của zmp-sdk nhưng không có trong tài
  liệu chính thức. Nếu bị từ chối khi duyệt, bỏ nút này và chỉ dùng `openWebview`.
- Kiểm tra link hoàn tiền mở từ Mini App có được sàn ghi nhận đơn không (tạo 1 đơn thật nhỏ khi
  đã bật provider thật) — webview trong Zalo có thể khác trình duyệt về cookie tracking.
- Zalo duyệt nội dung Mini App: nội dung hoàn tiền phải khớp với thực tế (đã hiển thị tỷ lệ thực
  nhận + thời gian chờ), cần có trang điều khoản/chính sách với thông tin pháp nhân thật.

## Việc tiếp theo nên làm

- **Liên kết tài khoản web ↔ Zalo** (như `/telegram`) để 1 người không có 2 ví.
- **Zalo OA + tin nhắn thông báo** ("Đơn Shopee +22.000₫ đã ghi nhận") — kênh giữ chân quan trọng
  nhất trong 30–60 ngày chờ đối soát. Cần OA đã xác thực và tuân thủ chính sách gửi tin của Zalo.
- Nút **chia sẻ deal** (`openShareSheet`) để khách gửi link sản phẩm cho bạn bè — **không kèm
  thưởng giới thiệu** (xem cảnh báo pháp lý trong `lib/membership.ts`).
