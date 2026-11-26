import { Box, Text } from "zmp-ui";
import { formatVnd, type CashbackEstimate } from "../lib/api";

/** "Bạn được hoàn X% — đơn 500k ≈ +11k — về ví sau 30–60 ngày": the honest promise, in VND. */
export function EstimateCard({ estimate }: { estimate: CashbackEstimate }) {
  return (
    <Box className="kb-card kb-estimate">
      <Box flex alignItems="center" className="kb-row-gap">
        <span className="kb-emoji">{estimate.shopEmoji}</span>
        <Text.Title size="small">{estimate.shopName}</Text.Title>
      </Box>
      <Text className="kb-mt8">
        Bạn được hoàn <strong className="kb-brand">{estimate.userRate}%</strong> giá trị đơn{" "}
        <span className="kb-muted">(hạng {estimate.tierLabel})</span>
      </Text>
      <Box className="kb-examples">
        {estimate.examples.map((ex) => (
          <Box key={ex.orderAmount} className="kb-example">
            <Text size="xSmall" className="kb-muted">
              Đơn {formatVnd(ex.orderAmount)}
            </Text>
            <Text bold className="kb-accent">
              +{formatVnd(ex.cashback)}
            </Text>
          </Box>
        ))}
      </Box>
      <Text size="xSmall" className="kb-muted kb-mt8">
        Tiền về ví sau khi sàn xác nhận đơn, thường {estimate.settlement}.
        {estimate.topTierRate > estimate.userRate && ` Hạng Vàng được hoàn tới ${estimate.topTierRate}%.`}
      </Text>
    </Box>
  );
}
