export type FalQueueSubmit = {
  request_id?: string;
  status_url?: string;
  response_url?: string;
};

export function falPollUrls(queued: FalQueueSubmit): {
  requestId: string;
  statusUrl: string;
  resultUrl: string;
} {
  const requestId = queued.request_id?.trim();
  const statusUrl = queued.status_url?.trim();
  const resultUrl = queued.response_url?.trim();
  if (!requestId) {
    throw new Error("Fal returned no request id");
  }
  if (!statusUrl || !resultUrl) {
    throw new Error("Fal returned no queue URLs");
  }
  return { requestId, statusUrl, resultUrl };
}
