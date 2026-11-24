# Chiến lược Sàn Affiliate & Đa Dạng Hóa Nguồn Hoa Hồng cho KBack (2026)

> Tài liệu nghiên cứu các Affiliate Network hỗ trợ **mô hình Cashback tại Việt Nam**, so sánh tỷ lệ hoa hồng, độ khó duyệt chiến dịch (Shopee, Lazada, TikTok Shop, Tiki) và đề xuất lộ trình kết hợp **Đa Network + Ngách biên độ cao (Du lịch & Tài chính)** để triển khai nhanh và ổn định.

---

## 1. Vì sao không nên phụ thuộc 100% vào một sàn (AccessTrade) cho Shopee/Lazada?

- **Shopee & Lazada siết mạnh traffic Cashback/Incentivized:** Các sàn TMĐT liên tục tạm đóng duyệt publisher mới (như AccessTrade từng đóng duyệt Shopee) để rà soát gian lận tự mua (self-referral), gom đơn hộ, và xếp chồng voucher.
- **Biên độ hoa hồng TMĐT ngày càng mỏng & bị trần (cap):** Danh mục điện tử/điện thoại chỉ ~1%–2%, thường có trần tối đa theo sản phẩm; thời gian đối soát dài **30–75 ngày** mới trả tiền.
- **Rủi ro đơn điểm (Single Point of Failure):** Nếu chỉ gắn 1 network và network đó đóng campaign Shopee thì gần như toàn bộ trải nghiệm chính của app bị tê liệt.

**Giải pháp kiến trúc:** Thiết kế **Multi-Network Router** trong `lib/affiliate/` — mỗi `Shop` có thể chọn provider riêng (`involve_asia`, `masoffer`, `ecomobi`, `accesstrade`, `rentracks`, `admitad`, `direct`), kèm cơ chế fallback tự động nếu một network tạm dừng chiến dịch.

---

## 2. So sánh chi tiết các Affiliate Network hỗ trợ Cashback tại Việt Nam

| Tiêu chí | **Involve Asia** ⭐ | **MasOffer** ⭐ | **Ecomobi** | **Rentracks VN** | **Admitad** | **AccessTrade** (hiện tại) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Phủ sóng sàn TMĐT VN** | Shopee, Lazada, TikTok Shop, Tiki, AliExpress + Du lịch (Agoda, Klook, Trip.com) | Shopee, Lazada, Tiki, TikTok Shop, Du lịch, Tài chính | Shopee, Lazada, TikTok Shop, Tiki, Sendo (rất mạnh MCN/Social) | Shopee (*có riêng campaign Shopee Cashback*), Lazada, TikTok Shop, Tài chính | Shopee VN/SEA, Lazada, AliExpress, Travel, SaaS | Shopee, Lazada, Tiki, TikTok Shop, Tài chính, Du lịch |
| **Độ dễ duyệt Shopee/Lazada cho Cashback** | **Trung bình – Dễ hơn AT** (khai báo rõ loại hình *Cashback/Coupon*, có duyệt từng offer rõ ràng) | **Trung bình – Khá dễ** (hỗ trợ publisher nội địa, thủ tục VN nhanh) | **Dễ nhất cho TikTok Shop & Shopee Social**, cần trao đổi AM nếu chạy thuần cashback | **Cao nếu có pháp nhân/HKD** (chuyên làm việc với Sub-net & có hẳn offer Cashback riêng) | **Trung bình** (chấp nhận mô hình Loyalty/Cashback bài bản theo chuẩn quốc tế) | **Khó ở thời điểm hiện tại** (hay tạm ngưng duyệt Shopee cho pub mới) |
| **API & Postback (S2S)** | **Rất tốt** — Deeplink API, Offers API, Conversion API, Postback S2S đầy đủ | **Tốt** — Publisher API (`publisher-api.masoffer.net`), tài liệu tiếng Việt dễ tích hợp | **Tốt** — API tracking & automation cho publisher/bot | **Tốt cho Sub-net** (cần AM mở quyền API & Postback) | **Rất mạnh** — REST API chuẩn quốc tế, có bộ công cụ sẵn cho Loyalty/Cashback | **Tốt** — đã tích hợp sẵn trong KBack |
| **Thanh toán / Rút tiền** | Chuyển khoản NH VN / PayPal / Wise (ngưỡng thấp ~RM80 / ~$20) | Chuyển khoản NH VN (VND), ngưỡng ~200.000đ | Chuyển khoản NH VN (VND), hỗ trợ nhanh | Chuyển khoản NH VN (VND), uy tín cao (gốc Nhật) | Chuyển khoản / Payoneer / PayPal (USD) | Chuyển khoản NH VN (VND), ngưỡng 200.000đ |
| **Thời gian duyệt đơn (TMĐT)** | 30–75 ngày | 30–60 ngày | 30–60 ngày | 30–60 ngày | 30–75 ngày | 30–60 ngày |
| **Phù hợp nhất cho vai trò gì ở KBack?** | **Xương sống đa sàn (Shopee + Lazada + Travel quốc tế)** | **Xương sống nội địa VN (Shopee/Lazada/Tiki + API tiếng Việt)** | **Kênh TikTok Shop & chiến dịch thưởng thêm (Xtra)** | **Kênh dự phòng/nâng cấp khi đã có HKD/Doanh nghiệp (Sub-net)** | **Mở rộng Global (AliExpress, Travel, Phần mềm/SaaS)** | Giữ làm 1 adapter song song (đặc biệt cho Tiki, TikTok, Tài chính) |

---

## 3. So sánh tỷ lệ hoa hồng (%) theo từng kênh & ngách

### A. Nhóm Thương mại điện tử (Lưu lượng lớn, giữ chân người dùng hàng ngày)
| Sàn / Kênh | Tỷ lệ hoa hồng gốc (Network trả KBack) | Hoàn lại cho User (50%–80% theo hạng) | Đặc điểm & lưu ý |
| :--- | :--- | :--- | :--- |
| **Shopee VN** | **1.2% – 9%** (base ~1.2%–3.7% tùy ngành; Shopee Mall / Xtra / Video tới **10%–20%+**) | 0.6% – 7%+ | Khối lượng đơn lớn nhất VN; có trần hoa hồng/sản phẩm; duyệt chặt nhất. |
| **Lazada VN** | **1% – 10%** (điện tử ~1–2%; Thời trang/Mỹ phẩm/LazMall **5%–15%+**) | 0.5% – 8%+ | Tỷ lệ duyệt ở Involve Asia / MasOffer thường dễ hơn Shopee. |
| **TikTok Shop** | **1% – 20%+** (nhiều shop/MCN set **8%–15%**; Mall ~5%–14%) | 4% – 12%+ | **Biên độ cao nhất trong nhóm TMĐT**, dễ triển khai qua Ecomobi / Involve Asia / AccessTrade. |
| **Tiki** | **2% – 6%** (Sách, gia dụng, FMCG) | 1% – 4.5% | Dễ duyệt, ít rủi ro khóa hơn Shopee, nhưng thị phần nhỏ hơn. |
| **ShopeeFood / Ẩm thực** | **3% – 8%** (thường ưu đãi cao cho đơn mới) | 1.5% – 6% | Tần suất mua lặp lại cao, giữ thói quen mở app hằng ngày. |

### B. Nhóm Ngách Biên Độ Cao & DỄ DUYỆT NHẤT (Nên triển khai NGAY để có doanh thu sớm!)
> Đây là "vũ khí bí mật" của các app cashback lớn (như ShopBack): **TMĐT dùng để giữ chân thói quen**, còn **Du lịch + Tài chính + Digital** mới là nguồn tạo lợi nhuận thực sự (hoa hồng gấp 5–20 lần TMĐT và duyệt publisher cực thoáng!).

| Ngách & Đối tác tiêu biểu | Hoa hồng gốc | Tốc độ duyệt | Vì sao cực phù hợp với KBack |
| :--- | :--- | :--- | :--- |
| **1. Du lịch & Đặt phòng** *(Agoda, Trip.com, Klook, Traveloka, Booking)* | **4% – 7%** khách sạn/tour; **eSIM Klook lên tới 15%–20%**; vé máy bay 0.5%–1.5% | **Rất dễ** (qua Involve Asia / Ecomobi / Travelpayouts) | Giá trị 1 đơn rất lớn (2–20 triệu đ) → 1 đơn hoàn **100k–500k**, user cực thích & ít gian lận. |
| **2. Tài chính & Ngân hàng (CPA)** *(Mở thẻ tín dụng VPBank, VIB, HSBC, Sacombank, Cake, MB, TNEX)* | **80.000đ – 800.000đ / hồ sơ duyệt** (cố định theo hành động CPA) | **Dễ – Trung bình** (qua AccessTrade, Rentracks, MasOffer, Dinos) | **Lợi nhuận cao nhất thị trường!** Chỉ cần 1 user mở thẻ tín dụng hoàn 200k–400k là bằng cả trăm đơn Shopee. |
| **3. Số hóa / Phần mềm / Hosting / VPN / AI** *(Canva, NordVPN, Hostinger, Coursera, Udemy, Airalo eSIM)* | **20% – 50%** (thậm chí **100%** tháng đầu cho VPN/Hosting) | **Rất dễ** (Impact, PartnerStack, Admitad, Involve Asia) | Tỷ lệ % cực cao, người dùng văn phòng/sinh viên/freelancer tại VN mua nhiều. |
| **4. Vé xem phim / Nạp thẻ / Voucher F&B** *(Got It, UrBox, Topup điện thoại)* | **1.5% – 5%** | **Dễ** (hợp tác B2B API) | Tần suất lặp lại cao, đối soát nhanh (gần như tức thì, không phải đợi 60 ngày). |

---

## 4. Định hướng chiến lược triển khai dễ nhất & tối ưu nhất cho KBack

### Giai đoạn 1 (Tuần 1–2): Triển khai "Bộ đôi thực chiến" — **Involve Asia + MasOffer** (giữ AccessTrade làm phụ)
1. **Đăng ký đồng thời 2 network chính:**
   - **Involve Asia:** Mở ngay các offer **Lazada VN, TikTok Shop, Agoda, Klook, Trip.com, Shopee VN** (khai báo website `https://kback-app.vercel.app` thuộc nhóm *Cashback / Loyalty*). Tận dụng Deeplink API + Postback S2S cực chuẩn.
   - **MasOffer:** Đăng ký làm nguồn dự phòng cho **Shopee, Lazada, Tiki** với Publisher API tài liệu tiếng Việt, rút tiền VND nhanh.
2. **Bật ngay 3 nhóm chiến dịch dễ duyệt để chạy tiền thật sớm (không bị kẹt chờ Shopee):**
   - **TikTok Shop** (hoa hồng cao 5%–15%, tăng trưởng nhanh nhất).
   - **Du lịch (Agoda + Klook + Trip.com)** (duyệt nhanh, hoàn tiền to 4%–20%).
   - **Tài chính CPA (Mở thẻ/tài khoản ngân hàng)** (tạo mục *"Nhiệm vụ hoàn tiền 200k–500k"* ngay trên Dashboard KBack — vừa kéo user đăng ký cực mạnh vừa có dòng tiền nuôi hệ thống!).

### Giai đoạn 2 (Tháng 1–2): Mở rộng **Ecomobi** (TikTok/Social) & **Rentracks Sub-net** (Shopee Cashback chính ngạch)
- Sau khi hoàn tất đăng ký **Hộ kinh doanh** và có traffic thật từ Giai đoạn 1 (~vài trăm–vài nghìn click/tháng):
  - Làm việc trực tiếp với AM của **Rentracks Vietnam** để mở campaign **Shopee Cashback / Sub-net API** (ổn định nhất cho Shopee dài hạn).
  - Kết nối thêm **Ecomobi** để khai thác các campaign thưởng hoa hồng Xtra trên TikTok Shop & Shopee.

### Giai đoạn 3 (Kỹ thuật trong codebase KBack): Nâng cấp kiến trúc Multi-Provider Router
Hiện tại KBack đã có kiến trúc adapter sạch ở `lib/affiliate/`:
- Chỉ cần nâng cấp `Shop` thêm cột `affiliateProvider` (ví dụ `INVOLVE_ASIA`, `MASOFFER`, `ACCESSTRADE`, `ECOMOBI`, `RENTRACKS`) + `externalOfferId`.
- Khi 1 network tạm ngưng Shopee, Admin chỉ cần vào `/admin/shops` đổi provider của shop Shopee từ `ACCESSTRADE` sang `INVOLVE_ASIA` hoặc `MASOFFER` trong **5 giây — không cần sửa code hay deploy lại!**
- Bổ sung 1 Vercel Cron Job (chạy mỗi 2–4 giờ) kéo Conversion API từ các network về đối soát song song với Postback S2S để tỷ lệ mất đơn = 0%.
