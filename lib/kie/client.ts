/**
 * Thin client for kie.ai's unified job API (https://docs.kie.ai/market/quickstart).
 * All models (image edit, image-to-video, text-to-speech) share the same createTask /
 * recordInfo shape — only `model` and `input` differ per call site.
 */

export interface CreateTaskResult {
  taskId: string;
}

export type KieTaskState = "waiting" | "queuing" | "generating" | "success" | "fail";

export interface KieTaskRecord {
  taskId: string;
  state: KieTaskState;
  /** Result payload once state === "success" — shape varies per model, caller narrows it. */
  resultJson?: unknown;
  failMsg?: string;
}

function getApiKey(): string {
  const key = process.env.KIE_API_KEY;
  if (!key) {
    throw new Error(
      "KIE_API_KEY chưa được cấu hình trong .env — cần key thật từ https://kie.ai để dùng tính năng tạo video.",
    );
  }
  return key;
}

function getBaseUrl(): string {
  return process.env.KIE_API_BASE_URL ?? "https://api.kie.ai";
}

export async function createKieTask(
  model: string,
  input: Record<string, unknown>,
  callBackUrl?: string,
): Promise<CreateTaskResult> {
  const res = await fetch(`${getBaseUrl()}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({ model, input, callBackUrl }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.data?.taskId) {
    throw new Error(
      `kie.ai createTask thất bại (model=${model}, status=${res.status}): ${JSON.stringify(body)}`,
    );
  }

  return { taskId: body.data.taskId as string };
}

export async function getKieTaskStatus(taskId: string): Promise<KieTaskRecord> {
  const res = await fetch(
    `${getBaseUrl()}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    { headers: { Authorization: `Bearer ${getApiKey()}` } },
  );

  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.data) {
    throw new Error(
      `kie.ai recordInfo thất bại (taskId=${taskId}, status=${res.status}): ${JSON.stringify(body)}`,
    );
  }

  return {
    taskId,
    state: body.data.state as KieTaskState,
    resultJson: body.data.resultJson,
    failMsg: body.data.failMsg,
  };
}
