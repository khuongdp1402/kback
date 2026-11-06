import { Card } from "@/components/ui/card";

const sections = [
  {
    title: "1. Thông tin thu thập",
    body: `Họ tên, email, mật khẩu (được mã hoá), lịch sử nhấp liên kết mua sắm, lịch sử giao dịch
    hoàn tiền, và thông tin tài khoản ngân hàng khi bạn yêu cầu rút tiền.`,
  },
  {
    title: "2. Mục đích sử dụng",
    body: `Thông tin được dùng để: xác thực tài khoản, ghi nhận và đối soát tiền hoàn với đối tác
    affiliate network, xử lý yêu cầu rút tiền, và tuân thủ nghĩa vụ báo cáo thuế theo quy định
    pháp luật.`,
  },
  {
    title: "3. Chia sẻ thông tin với bên thứ ba",
    body: `KBack chia sẻ mã theo dõi (không phải thông tin cá nhân định danh) với affiliate
    network và sàn TMĐT đối tác để ghi nhận đơn hàng và hoa hồng. Thông tin ngân hàng chỉ được sử
    dụng để chuyển tiền hoàn, không chia sẻ cho bên thứ ba ngoài mục đích này.`,
  },
  {
    title: "4. Lưu trữ và bảo mật",
    body: `Mật khẩu được mã hoá một chiều (bcrypt), không lưu dưới dạng văn bản thuần. Dữ liệu
    được lưu trữ trên hạ tầng có kiểm soát truy cập.`,
  },
  {
    title: "5. Quyền của người dùng",
    body: `Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xoá thông tin cá nhân của mình, trừ dữ liệu
    cần lưu trữ để tuân thủ nghĩa vụ pháp lý (ví dụ chứng từ giao dịch phục vụ đối soát thuế).`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">Chính sách bảo mật</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Cập nhật lần cuối: [điền ngày phát hành chính thức]
      </p>

      <Card className="mt-8 divide-y divide-border">
        {sections.map((s) => (
          <div key={s.title} className="p-6">
            <h2 className="text-base font-semibold text-foreground">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
