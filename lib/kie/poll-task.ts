import { getKieTaskStatus, type KieTaskRecord } from "./client";

/**
 * Polls a kie.ai task until it succeeds or fails, for call sites where an admin is actively
 * waiting on the result synchronously (e.g. previewing a generated image) rather than a
 * long-running video job that should use callBackUrl + webhook instead.
 */
export async function pollKieTaskUntilDone(
  taskId: string,
  { intervalMs = 2000, timeoutMs = 90_000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<KieTaskRecord> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const record = await getKieTaskStatus(taskId);
    if (record.state === "success" || record.state === "fail") {
      return record;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`kie.ai task ${taskId} không hoàn thành trong ${timeoutMs}ms`);
}
