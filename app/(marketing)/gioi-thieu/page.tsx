import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">Về KBack</h1>
      <p className="mt-3 text-muted-foreground">
        Cách KBack hoạt động và vì sao mô hình hoàn tiền của chúng tôi minh bạch, hợp pháp.
      </p>

      <Card className="mt-8 space-y-4 p-6 text-sm leading-relaxed text-foreground">
        <p>
          KBack là nền tảng tiếp thị liên kết (affiliate marketing), kết nối người mua sắm với
          các sàn thương mại điện tử đối tác. Khi bạn mua hàng qua liên kết của KBack, sàn TMĐT
          trả cho KBack một khoản hoa hồng affiliate cho đơn hàng đó. KBack chia lại phần lớn
          khoản hoa hồng này cho chính bạn dưới dạng tiền hoàn — đây là mô hình cùng loại với các
          nền tảng hoàn tiền quốc tế đang hoạt động hợp pháp tại Việt Nam.
        </p>
        <h2 className="pt-2 text-base font-semibold text-foreground">
          Nguyên tắc hoạt động của KBack
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Tiền hoàn luôn gắn với một đơn hàng thật, đã được sàn TMĐT xác nhận — không có khái
            niệm &quot;tiền ảo&quot; hay &quot;điểm quy đổi&quot; không rõ nguồn gốc.
          </li>
          <li>
            Hạng thành viên (Thành viên / Bạc / Vàng) chỉ tính theo{" "}
            <strong>tổng giá trị đơn hàng chính bạn đã mua</strong>, quyết định tỷ lệ hoa hồng bạn
            được chia lại cho các đơn hàng tiếp theo của chính bạn.
          </li>
          <li>
            KBack <strong>không</strong> có chương trình mời bạn bè, không trả thưởng khi bạn
            giới thiệu người khác, và không có cơ chế hưởng hoa hồng từ đơn hàng của người dùng
            khác dưới bất kỳ hình thức nào.
          </li>
          <li>Không yêu cầu nạp tiền, đặt cọc hay mua gói thành viên để bắt đầu sử dụng.</li>
        </ul>
        <h2 className="pt-2 text-base font-semibold text-foreground">Thông tin pháp nhân</h2>
        <p className="text-muted-foreground">
          [Điền tên hộ kinh doanh/doanh nghiệp, mã số thuế, địa chỉ đăng ký kinh doanh sau khi
          hoàn tất thủ tục đăng ký — bắt buộc để thông báo website thương mại điện tử với Bộ Công
          Thương theo Nghị định 52/2013/NĐ-CP.]
        </p>
      </Card>
    </div>
  );
}
