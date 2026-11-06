export function statusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Chờ xác nhận";
    case "CONFIRMED":
      return "Đã xác nhận";
    case "EXPIRED":
      return "Đã hết hạn";
    case "REJECTED":
      return "Bị từ chối";
    default:
      return status;
  }
}

export function statusTone(status: string): "default" | "success" | "warning" | "danger" {
  switch (status) {
    case "CONFIRMED":
      return "success";
    case "PENDING":
      return "warning";
    case "REJECTED":
    case "EXPIRED":
      return "danger";
    default:
      return "default";
  }
}

export function payoutStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Chờ duyệt";
    case "APPROVED":
      return "Đang xử lý";
    case "PAID":
      return "Đã chuyển khoản";
    case "REJECTED":
      return "Bị từ chối";
    default:
      return status;
  }
}

export function payoutStatusTone(status: string): "default" | "success" | "warning" | "danger" {
  switch (status) {
    case "PAID":
      return "success";
    case "PENDING":
    case "APPROVED":
      return "warning";
    case "REJECTED":
      return "danger";
    default:
      return "default";
  }
}
