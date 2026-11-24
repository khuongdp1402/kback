import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ShareTargetHandler } from "@/components/share-target-handler";

const URL_REGEX = /https?:\/\/\S+/i;

function extractSharedUrl(params: { url?: string; text?: string; title?: string }): string | null {
  for (const candidate of [params.url, params.text, params.title]) {
    if (!candidate) continue;
    const match = candidate.match(URL_REGEX);
    if (match?.[0]) return match[0];
  }
  return null;
}

export default async function ShareTargetPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; text?: string; title?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const sharedUrl = extractSharedUrl(params);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tạo link hoàn tiền nhanh</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          KBack tự động nhận link bạn chia sẻ từ Shopee, Lazada, Tiki, TikTok Shop hoặc ShopeeFood.
        </p>
      </div>
      <ShareTargetHandler sharedUrl={sharedUrl} />
    </div>
  );
}
