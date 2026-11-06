import { Card } from "@/components/ui/card";

const sections = [
  {
    title: "1. Mô hình hoạt động",
    body: `KBack là nền tảng tiếp thị liên kết, không phải sàn giao dịch thương mại điện tử. KBack
    không bán hàng, không lưu kho, không xử lý thanh toán đơn hàng — mọi giao dịch mua sắm diễn
    ra trực tiếp trên website/ứng dụng của sàn TMĐT đối tác.`,
  },
  {
    title: "2. Điều kiện nhận tiền hoàn",
    body: `Tiền hoàn chỉ được ghi nhận khi: (a) bạn nhấp vào liên kết theo dõi của KBack trước khi
    mua hàng, (b) đơn hàng được sàn TMĐT xác nhận thành công, và (c) sàn TMĐT thanh toán hoa hồng
    affiliate tương ứng cho KBack. Đơn hàng bị huỷ, hoàn trả, hoặc không đủ điều kiện theo chính
    sách của sàn TMĐT sẽ không được ghi nhận tiền hoàn.`,
  },
  {
    title: "3. Hạng thành viên",
    body: `Hạng thành viên được tính tự động dựa trên tổng giá trị đơn hàng đã xác nhận của chính
    tài khoản bạn trong lịch sử sử dụng. Hạng thành viên không thể mua, không thể chuyển nhượng,
    và không liên quan đến việc giới thiệu hay mời người dùng khác.`,
  },
  {
    title: "4. Không có chương trình đa cấp",
    body: `KBack không tổ chức, không vận hành và không cho phép bất kỳ hình thức kinh doanh theo
    phương thức đa cấp nào. KBack không trả thưởng cho việc tuyển dụng, giới thiệu người dùng
    mới, hoặc xây dựng mạng lưới người dùng theo tầng bậc.`,
  },
  {
    title: "5. Rút tiền",
    body: `Số dư khả dụng (tiền hoàn đã được sàn TMĐT xác nhận) có thể được yêu cầu rút về tài
    khoản ngân hàng chính chủ của bạn. Thời gian xử lý phụ thuộc vào đối tác thanh toán được sử
    dụng tại từng thời điểm.`,
  },
  {
    title: "6. Trách nhiệm và giới hạn",
    body: `KBack không chịu trách nhiệm về chất lượng sản phẩm, chính sách bảo hành, giao hàng
    hay khiếu nại liên quan trực tiếp đến đơn hàng — các vấn đề này thuộc trách nhiệm của sàn TMĐT
    nơi bạn đặt hàng.`,
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">Điều khoản sử dụng</h1>
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
