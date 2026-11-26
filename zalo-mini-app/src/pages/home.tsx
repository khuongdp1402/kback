import { useState } from "react";
import { Box, Button, Input, Page, Text, useSnackbar } from "zmp-ui";
import { api, ApiError, type CashbackEstimate } from "../lib/api";
import { copyText, openInBrowser, openTrackedLink, readClipboardUrl } from "../lib/open-link";
import { EstimateCard } from "../components/estimate-card";

const STEPS = [
  "Trong Shopee/Lazada/Tiki/TikTok Shop, bấm Chia sẻ → Sao chép liên kết sản phẩm.",
  "Mở KBack trong Zalo, dán link — biết ngay được hoàn bao nhiêu tiền.",
  "Bấm “Mua ngay” và thanh toán như bình thường. Đơn hiện trong Ví ở trạng thái chờ xác nhận.",
];

export default function HomePage() {
  const { openSnackbar } = useSnackbar();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ trackedUrl: string; estimate: CashbackEstimate } | null>(null);

  async function handleCreate(targetUrl = url) {
    if (!targetUrl.trim()) {
      setError("Vui lòng dán link sản phẩm");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.createLink(targetUrl.trim());
      setResult({ trackedUrl: data.trackedUrl, estimate: data.estimate });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasteFromClipboard() {
    const found = await readClipboardUrl();
    if (!found) {
      openSnackbar({ text: "Không đọc được link trong bộ nhớ tạm — hãy dán thủ công", type: "warning" });
      return;
    }
    setUrl(found);
    void handleCreate(found);
  }

  async function handleCopy() {
    if (!result) return;
    const ok = await copyText(result.trackedUrl);
    openSnackbar({ text: ok ? "Đã sao chép link hoàn tiền" : "Không sao chép được", type: ok ? "success" : "error" });
  }

  return (
    <Page className="kb-page">
      <Box className="kb-hero">
        <Text.Title size="large" className="kb-hero-title">
          Dán link, biết ngay được hoàn bao nhiêu
        </Text.Title>
        <Text size="small" className="kb-hero-sub">
          Shopee · Lazada · Tiki · TikTok Shop · ShopeeFood — giá không đổi, không tốn phí.
        </Text>
      </Box>

      <Box className="kb-card">
        <Input
          label="Link sản phẩm"
          placeholder="https://shopee.vn/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          clearable
          status={error ? "error" : undefined}
          errorText={error ?? undefined}
        />
        <Box className="kb-actions">
          <Button fullWidth loading={loading} onClick={() => void handleCreate()}>
            Tạo link hoàn tiền
          </Button>
          <Button fullWidth variant="secondary" onClick={() => void handlePasteFromClipboard()}>
            Dán từ bộ nhớ tạm
          </Button>
        </Box>
      </Box>

      {result && (
        <>
          <EstimateCard estimate={result.estimate} />
          <Box className="kb-card">
            <Button fullWidth onClick={() => void openTrackedLink(result.trackedUrl)}>
              Mua ngay & nhận hoàn tiền
            </Button>
            <Box className="kb-actions">
              <Button fullWidth variant="secondary" onClick={() => void openInBrowser(result.trackedUrl)}>
                Mở bằng ứng dụng sàn
              </Button>
              <Button fullWidth variant="tertiary" onClick={() => void handleCopy()}>
                Sao chép link
              </Button>
            </Box>
            <Text size="xSmall" className="kb-muted kb-mt8">
              Lưu ý: hoàn tiền chỉ được ghi nhận khi bạn thanh toán ngay sau khi mở link này, không
              mở link sản phẩm khác xen giữa.
            </Text>
          </Box>
        </>
      )}

      <Box className="kb-card">
        <Text.Title size="small">Cách nhận hoàn tiền</Text.Title>
        <ol className="kb-steps">
          {STEPS.map((s) => (
            <li key={s}>
              <Text size="small">{s}</Text>
            </li>
          ))}
        </ol>
      </Box>
    </Page>
  );
}
