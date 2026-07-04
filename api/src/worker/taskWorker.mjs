import { runProviderAttempt } from "../providerAdapters/index.mjs";

export async function executeGenerationTask({
  task,
  catalogRepository,
  selectRoute,
  mapPayload,
  createId,
}) {
  const primaryAttempt = task.attempts[task.attempts.length - 1];

  try {
    const result = await runAttempt({
      task,
      attempt: primaryAttempt,
      catalogRepository,
    });
    primaryAttempt.status = "completed";
    primaryAttempt.finishedAt = new Date().toISOString();
    primaryAttempt.upstreamResponse = result.raw;
    return {
      status: "completed",
      output: result.output,
      currentStep: "Generation completed; result has been saved.",
    };
  } catch (error) {
    primaryAttempt.status = "failed";
    primaryAttempt.errorCode = error.code ?? "PROVIDER_FAILED";
    primaryAttempt.errorMessage = error.message ?? "Upstream provider failed.";
    primaryAttempt.finishedAt = new Date().toISOString();

    const fallbackChannel = findFallbackChannel({ task, selectRoute, failedChannelId: primaryAttempt.channelId });
    if (!fallbackChannel) {
      return {
        status: "failed",
        publicErrorCode: "PROVIDER_FAILED",
        publicErrorMessage: "The service is busy. Frozen funds have been released.",
      };
    }

    const provider = catalogRepository.getProvider(fallbackChannel.providerId);
    const providerModel = catalogRepository.getProviderModel(fallbackChannel.providerModelId);
    const fallbackPayload = mapPayload(fallbackChannel, providerModel, task.input);
    const fallbackAttempt = {
      id: createId("attempt"),
      providerId: provider.id,
      providerModelId: providerModel.id,
      channelId: fallbackChannel.id,
      status: "running",
      mappedPayload: fallbackPayload,
      costPrice: fallbackChannel.costPrice,
      errorCode: null,
      errorMessage: null,
      fallbackReason: `${primaryAttempt.errorCode}; switched to backup channel.`,
      createdAt: new Date().toISOString(),
    };

    task.attempts.push(fallbackAttempt);
    task.selectedChannelId = fallbackChannel.id;
    task.selectedProviderId = provider.id;
    task.selectedProviderModelId = providerModel.id;
    task.mappedPayload = fallbackPayload;

    try {
      const fallbackResult = await runProviderAttempt({
        provider,
        providerModel,
        channel: fallbackChannel,
        payload: fallbackPayload,
        task,
      });
      fallbackAttempt.status = "completed";
      fallbackAttempt.finishedAt = new Date().toISOString();
      fallbackAttempt.upstreamResponse = fallbackResult.raw;
      return {
        status: "completed",
        output: fallbackResult.output,
        currentStep: "Primary channel failed; backup channel completed the task.",
      };
    } catch (fallbackError) {
      fallbackAttempt.status = "failed";
      fallbackAttempt.errorCode = fallbackError.code ?? "PROVIDER_FAILED";
      fallbackAttempt.errorMessage = fallbackError.message ?? "Backup provider failed.";
      fallbackAttempt.finishedAt = new Date().toISOString();
      return {
        status: "failed",
        publicErrorCode: "PROVIDER_FAILED",
        publicErrorMessage: "The service is busy. Frozen funds have been released.",
      };
    }
  }
}

async function runAttempt({ task, attempt, catalogRepository }) {
  const provider = catalogRepository.getProvider(attempt.providerId);
  const providerModel = catalogRepository.getProviderModel(attempt.providerModelId);
  const channel = catalogRepository.getChannel(attempt.channelId);
  attempt.status = "running";
  return runProviderAttempt({
    provider,
    providerModel,
    channel,
    payload: attempt.mappedPayload,
    task,
  });
}

function findFallbackChannel({ task, selectRoute, failedChannelId }) {
  const decision = selectRoute(task.platformModelId, task.input, task.routeMode);
  return decision.rankedChannels?.find((channel) => channel.id !== failedChannelId) ?? null;
}
