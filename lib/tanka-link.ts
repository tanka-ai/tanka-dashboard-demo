// Tanka-Link MCP client used by Genapps-generated apps.
//
// Runtime contract:
//   - process.env.TANKA_LINK_MCP_BASE_URL  e.g. https://uat-tanka-oh-link.aws.tankatalk.com/mcp
//   - process.env.TANKA_TEST_USER_ID       development userId (real auth wires in later)
//
// Endpoint per app: ${BASE_URL}/${appName}
// Protocol: JSON-RPC 2.0 over POST with header X-User-Id.
// Server-side only. Never import this from client components.

const DEFAULT_TIMEOUT_MS = 30_000;
const CALL_TIMEOUT_MS = 120_000;

export class TankaLinkError extends Error {
  status: number;
  code?: string;
  payload?: unknown;
  constructor(message: string, opts: { status?: number; code?: string; payload?: unknown } = {}) {
    super(message);
    this.name = "TankaLinkError";
    this.status = opts.status ?? 500;
    this.code = opts.code;
    this.payload = opts.payload;
  }
}

interface CallContext {
  userId?: string;
  orgId?: string;
  traceId?: string;
}

export async function callLinkTool<T = unknown>(
  appName: string,
  toolName: string,
  args: Record<string, unknown> = {},
  context: CallContext = {},
): Promise<T> {
  if (!toolName) throw new TankaLinkError("toolName is required", { status: 400 });

  const baseUrl = requireEnv("TANKA_LINK_MCP_BASE_URL");
  const userId = context.userId ?? requireEnv("TANKA_TEST_USER_ID");

  if (!/^[a-zA-Z0-9_-]+$/.test(appName)) {
    throw new TankaLinkError("appName is invalid", { status: 400 });
  }

  const result = await rpcCall(baseUrl, appName, {
    body: {
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: toolName, arguments: { ...args, user_id: userId } },
      id: 1,
    },
    timeoutMs: CALL_TIMEOUT_MS,
    userId,
    orgId: context.orgId,
    traceId: context.traceId,
  });

  const content = (result && (result as { content?: unknown }).content) ?? [];
  const contentArr = Array.isArray(content) ? content : [];
  const single = contentArr.length === 1 ? (contentArr[0] as { type?: string; text?: string }) : null;
  const text = single?.type === "text" ? single.text ?? "" : null;

  if ((result as { isError?: boolean })?.isError) {
    throw new TankaLinkError(`Tanka-Link tool '${toolName}' returned isError: ${text ?? "(no text)"}`, {
      status: 502,
      code: "tool_error",
      payload: result,
    });
  }

  if (text !== null) {
    const trimmed = text.trim();
    if (trimmed && (trimmed.startsWith("{") || trimmed.startsWith("["))) {
      try {
        return JSON.parse(trimmed) as T;
      } catch {
        return text as unknown as T;
      }
    }
    return text as unknown as T;
  }
  return contentArr as unknown as T;
}

export async function listLinkTools(appName: string, context: CallContext = {}) {
  const baseUrl = requireEnv("TANKA_LINK_MCP_BASE_URL");
  return rpcCall(baseUrl, appName, {
    body: { jsonrpc: "2.0", method: "tools/list", id: 1 },
    timeoutMs: DEFAULT_TIMEOUT_MS,
    userId: context.userId,
    orgId: context.orgId,
    traceId: context.traceId,
  });
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new TankaLinkError(`${name} is not configured`, { status: 412 });
  }
  return value;
}

interface RpcOptions {
  body: unknown;
  timeoutMs: number;
  userId?: string;
  orgId?: string;
  traceId?: string;
}

async function rpcCall(baseUrl: string, appName: string, opts: RpcOptions): Promise<unknown> {
  const url = `${baseUrl.replace(/\/$/, "")}/${appName}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.userId) headers["X-User-Id"] = opts.userId;
  if (opts.orgId) headers["X-Org-Id"] = opts.orgId;
  if (opts.traceId) headers["X-Trace-Id"] = opts.traceId;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(opts.body),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "request failed";
    throw new TankaLinkError(`Tanka-Link network error: ${message}`, { status: 502 });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = await response.text().catch(() => "");
    }
    throw new TankaLinkError(`Tanka-Link HTTP ${response.status}`, { status: response.status, payload });
  }

  let envelope: unknown;
  try {
    envelope = await response.json();
  } catch {
    throw new TankaLinkError("Tanka-Link response is not JSON", { status: 502 });
  }

  const mcp = unwrapEnvelope(envelope);
  const errorMessage = readError(envelope, mcp);
  if (errorMessage) {
    throw new TankaLinkError(`Tanka-Link MCP error: ${errorMessage}`, { status: 502, payload: envelope });
  }
  return (mcp as { result?: unknown }).result ?? {};
}

function unwrapEnvelope(envelope: unknown): unknown {
  if (envelope && typeof envelope === "object") {
    const e = envelope as { data?: unknown };
    if (e.data && typeof e.data === "object" && "jsonrpc" in (e.data as object)) {
      return e.data;
    }
  }
  return envelope ?? {};
}

function readError(envelope: unknown, mcp: unknown): string | null {
  const m = mcp as { error?: { message?: string } };
  if (m?.error?.message) return m.error.message;
  const e = envelope as { code?: number; debugMsg?: string; data?: { error?: string } };
  if (typeof e?.data?.error === "string") return e.data.error;
  if (typeof e?.code === "number" && e.code !== 0 && e.debugMsg) return e.debugMsg;
  return null;
}
