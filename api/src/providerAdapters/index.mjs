import { config } from "../config.mjs";
import { providerError, retryWithBackoff } from "./retry.mjs";

export async function runProviderAttempt({ provider, providerModel, channel, payload, task }) {
  const adapter = selectAdapter(provider);
  return retryWithBackoff(
    () =>
      adapter.generate({
        provider,
        providerModel,
        channel,
        payload,
        task,
      }),
    {
      retries: channel.status === "degraded" ? 0 : 1,
      baseDelayMs: 120,
    }
  );
}

function selectAdapter(provider) {
  if (config.providerAdapterMode === "http") {
    return httpProviderAdapter;
  }

  if (provider.kind === "official" || provider.kind === "relay") {
    return mockProviderAdapter;
  }
  return mockProviderAdapter;
}

const mockProviderAdapter = {
  async generate({ provider, providerModel, channel, payload, task }) {
    const shouldFailover = task.input?.simulate_failover === true || task.input?.simulate_failover === "true";
    const isPrimaryAttempt = task.attempts?.length <= 1;

    if (shouldFailover && isPrimaryAttempt) {
      throw providerError("PROVIDER_TIMEOUT", "Upstream channel timed out.", {
        provider_id: provider.id,
        channel_id: channel.id,
      });
    }

    return {
      status: "completed",
      providerId: provider.id,
      providerModelId: providerModel.id,
      channelId: channel.id,
      raw: {
        provider: provider.name,
        upstream_model: providerModel.upstreamModelName,
        payload,
      },
      output: {
        assets: [`r2://outputs/${task.id}.json`],
        publicUrls: [`https://cdn.example.com/outputs/${task.id}.json`],
      },
    };
  },
};

export const httpProviderAdapter = {
  async generate({ provider, providerModel, channel, payload, task }) {
    const secret = resolveProviderSecret(provider);
    const endpoint = buildEndpoint(provider, providerModel);
    const controller = new AbortController();
    const timeoutMs = Number(channel.timeoutMs ?? provider.timeoutMs ?? 60_000);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: buildHeaders(provider, secret),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const raw = await readProviderResponse(response);

      if (!response.ok) {
        throw mapHttpProviderError(response, raw, provider);
      }

      const finalRaw = await maybePollAsyncResult({
        raw,
        provider,
        providerModel,
        channel,
        task,
        secret,
        signal: controller.signal,
      });

      return normalizeHttpProviderResult({
        raw: finalRaw,
        provider,
        providerModel,
        channel,
        task,
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        throw providerError("PROVIDER_TIMEOUT", `Provider ${provider.name} timed out after ${timeoutMs}ms.`, {
          provider_id: provider.id,
          timeout_ms: timeoutMs,
        });
      }
      if (error?.code) {
        throw error;
      }
      throw providerError("PROVIDER_NETWORK_ERROR", error?.message ?? "Provider network request failed.", {
        provider_id: provider.id,
      });
    } finally {
      clearTimeout(timeout);
    }
  },
};

function resolveProviderSecret(provider) {
  const secret = config.providerSecrets[provider.id] ?? provider.encryptedApiKey;

  if (!secret || String(secret).startsWith("demo-encrypted-")) {
    throw providerError("PROVIDER_NOT_CONFIGURED", `Provider ${provider.name} has no runtime API secret configured.`, {
      provider_id: provider.id,
    });
  }

  return secret;
}

function buildEndpoint(provider, providerModel) {
  const baseUrl = String(provider.baseUrl ?? "").replace(/\/+$/, "");
  const customPath =
    providerModel.rawCapabilities?.endpoint_path ??
    providerModel.rawCapabilities?.endpointPath ??
    providerModel.rawCapabilities?.path;
  const endpointPath = customPath ? normalizeEndpointPath(customPath) : endpointPathFor(providerModel.endpointType);
  return `${baseUrl}${endpointPath}`;
}

function normalizeEndpointPath(value) {
  const path = String(value ?? "").trim();
  if (!path) {
    return "/generate";
  }
  return path.startsWith("/") ? path : `/${path}`;
}

function endpointPathFor(endpointType) {
  const paths = {
    image_generation: "/images/generations",
    video_generation: "/videos/generations",
    chat_completions: "/chat/completions",
  };

  return paths[endpointType] ?? "/generate";
}

async function maybePollAsyncResult({ raw, provider, providerModel, channel, task, secret, signal }) {
  if (!providerModel.rawCapabilities?.async_poll) {
    return raw;
  }

  const taskId = extractTaskId(raw);
  const pathTemplate = providerModel.rawCapabilities?.poll_status_path ?? providerModel.rawCapabilities?.pollStatusPath;

  if (!taskId || !pathTemplate) {
    return raw;
  }

  const baseUrl = String(provider.baseUrl ?? "").replace(/\/+$/, "");
  const timeoutMs = Number(channel.timeoutMs ?? provider.timeoutMs ?? 60_000);
  const intervalMs = Number(providerModel.rawCapabilities?.poll_interval_ms ?? 1500);
  const startedAt = Date.now();
  let latest = raw;

  while (Date.now() - startedAt < timeoutMs) {
    await sleep(intervalMs);
    const endpoint = `${baseUrl}${String(pathTemplate).replace("{task_id}", encodeURIComponent(taskId))}`;
    const response = await fetch(endpoint, {
      method: "GET",
      headers: buildHeaders(provider, secret),
      signal,
    });
    latest = await readProviderResponse(response);

    if (!response.ok) {
      throw mapHttpProviderError(response, latest, provider);
    }

    const status = String(latest?.status ?? latest?.data?.status ?? latest?.data?.task_status ?? "").toLowerCase();
    if (["completed", "complete", "succeeded", "success", "finished"].includes(status) || extractUrls(latest).length > 0) {
      return latest;
    }
    if (["failed", "error", "cancelled", "canceled"].includes(status)) {
      throw providerError("PROVIDER_TASK_FAILED", latest?.message ?? latest?.error?.message ?? "Provider async task failed.", {
        provider_id: provider.id,
        task_id: task.id,
        upstream_task_id: taskId,
        raw: latest,
      });
    }
  }

  throw providerError("PROVIDER_TIMEOUT", `Provider ${provider.name} async task timed out after ${timeoutMs}ms.`, {
    provider_id: provider.id,
    task_id: task.id,
    upstream_task_id: taskId,
    raw: latest,
  });
}

function extractTaskId(raw) {
  return (
    raw?.task_id ??
    raw?.id ??
    raw?.data?.task_id ??
    raw?.data?.id ??
    raw?.data?.[0]?.task_id ??
    raw?.data?.[0]?.id ??
    null
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildHeaders(provider, secret) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (provider.authType === "bearer") {
    headers.Authorization = `Bearer ${secret}`;
  }

  if (provider.authType === "custom_header") {
    headers["X-API-Key"] = secret;
  }

  return headers;
}

async function readProviderResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw_text: text };
  }
}

function mapHttpProviderError(response, raw, provider) {
  const detail = raw?.error?.message ?? raw?.message ?? `Provider ${provider.name} returned HTTP ${response.status}.`;

  if (response.status === 401 || response.status === 403) {
    return providerError("PROVIDER_AUTH_FAILED", detail, { provider_id: provider.id, status: response.status, raw });
  }

  if (response.status === 408 || response.status === 504) {
    return providerError("PROVIDER_TIMEOUT", detail, { provider_id: provider.id, status: response.status, raw });
  }

  if (response.status === 429) {
    return providerError("PROVIDER_RATE_LIMITED", detail, { provider_id: provider.id, status: response.status, raw });
  }

  if (response.status >= 500) {
    return providerError("PROVIDER_5XX", detail, { provider_id: provider.id, status: response.status, raw });
  }

  return providerError("PROVIDER_REQUEST_FAILED", detail, { provider_id: provider.id, status: response.status, raw });
}

function normalizeHttpProviderResult({ raw, provider, providerModel, channel, task }) {
  const urls = extractUrls(raw);
  const text = extractText(raw);

  return {
    status: "completed",
    providerId: provider.id,
    providerModelId: providerModel.id,
    channelId: channel.id,
    raw,
    output: {
      assets: urls.length > 0 ? urls.map((url) => `remote://${url}`) : [`r2://outputs/${task.id}.json`],
      publicUrls: urls.length > 0 ? urls : [`https://cdn.example.com/outputs/${task.id}.json`],
      text: text ?? null,
    },
  };
}

function extractUrls(raw) {
  if (!raw || typeof raw !== "object") {
    return [];
  }

  const candidates = [
    raw.url,
    raw.output_url,
    raw.video_url,
    raw.image_url,
    ...(Array.isArray(raw.urls) ? raw.urls : []),
    ...(Array.isArray(raw.output_urls) ? raw.output_urls : []),
    ...(Array.isArray(raw.data) ? raw.data.map((item) => item?.url) : []),
  ];

  return candidates.filter((url) => typeof url === "string" && /^https?:\/\//i.test(url));
}

function extractText(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidates = [
    raw.text,
    raw.output_text,
    raw.content,
    raw.message?.content,
    raw.choices?.[0]?.message?.content,
    raw.choices?.[0]?.delta?.content,
    raw.choices?.[0]?.text,
    raw.data?.[0]?.text,
    raw.data?.[0]?.content,
  ];

  return candidates.find((value) => typeof value === "string" && value.trim()) ?? null;
}
