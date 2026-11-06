# KBack Mobile — WebView shell

Ứng dụng di động native (Android/iOS) cho KBack — một khung WebView mỏng bọc ngoài web app
KBack đã có (`kback-app.vercel.app`), dùng chung **100% UI và API** với bản web. Không có logic
nghiệp vụ riêng ở đây — mọi tính năng (đăng nhập, ví, shop, admin, liên kết Telegram) hoạt động
y hệt trình duyệt, chỉ khác là chạy trong 1 app có icon riêng, không có thanh địa chỉ.

## Vì sao WebView thay vì viết lại native UI

Nhanh nhất để có app "thật" trên Google Play/App Store mà không cần duplicate hàng chục màn
hình đã build sẵn ở web. Đánh đổi: chưa có tính năng thuần native như Share Extension (xem
`native-app-concept` — tài liệu ý tưởng riêng cho phần đó, chưa triển khai).

## Chạy thử

```bash
cd mobile
npm install
npx expo start
```

Quét mã QR bằng ứng dụng **Expo Go** (Android/iOS) để xem app chạy trên điện thoại thật, không
cần build gì cả. Hoặc nhấn `a` (Android emulator) / `i` (iOS simulator, cần macOS) trong terminal
khi `expo start` đang chạy.

## Cấu hình URL

`app.json` → `expo.extra.kbackUrl` trỏ tới `https://kback-app.vercel.app` (production) mặc định.
Đổi giá trị này (hoặc set biến môi trường tương ứng qua EAS) nếu cần trỏ vào 1 preview
deployment khác lúc test.

## Danh sách host được phép mở trong WebView (`App.tsx` → `IN_APP_HOSTS`)

- `kback-app.vercel.app` — chính app KBack
- `*.vercel.app` — preview deployments lúc dev
- `go.isclix.com`, `shorten.asia`, `click.accesstrade.vn` — chuỗi redirect tracking của
  AccessTrade khi bấm "Mua ngay", để link tracking chạy trọn trong WebView trước khi thoát ra
  trang sản phẩm thật

**Mọi domain khác** (shopee.vn, tiki.vn, tiktok.com...) tự động mở bằng trình duyệt/app hệ
thống thay vì render trong WebView — người dùng nên mua hàng trên app/web thật của sàn, không
phải bên trong khung WebView của KBack.

## Build & phát hành (chưa thực hiện)

Cần [EAS Build](https://docs.expo.dev/build/introduction/) (build trên cloud của Expo, không
cần Android Studio/Xcode cài đầy đủ trên máy):

```bash
npx eas login
npx eas build:configure
npx eas build --platform android   # hoặc --platform ios (cần Apple Developer Program)
npx eas submit --platform android  # đẩy lên Google Play sau khi build xong
```

Cần tài khoản Google Play Console (~25 USD một lần) và/hoặc Apple Developer Program (~99
USD/năm) trước khi submit thật lên store.

## Bước tiếp theo (chưa làm)

- Share Extension (nhận link từ nút Share của Shopee/Tiki/TikTok Shop) — cần code native riêng,
  xem tài liệu ý tưởng đã publish trước đó
- Push notification khi có giao dịch mới/được xác nhận — dùng `expo-notifications`, lưu Expo
  Push Token vào `User` (cần thêm field DB + endpoint đăng ký token)
- App icon/splash screen tinh chỉnh lại đúng bộ nhận diện KBack (hiện đang tái sử dụng file PNG
  từ `public/icons/` của web, chưa tối ưu riêng cho kích thước app icon)
