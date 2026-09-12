type FalImageResult = {
  images?: { url?: string }[];
  image?: { url?: string };
};

type FalQueueStatus = {
  status?: string;
  response_url?: string;
  request_id?: string;
};

export async function falTextToImage(args: {
  prompt: string;
  negativePrompt: string;
  aspect: "9:16" | "16:9" | "1:1";
}): Promise<{ url: string; requestId: string }> {
  const key = process.env.FAL_KEY;
  if (!key) {
    throw new Error("FAL_KEY is not set");
  }
  const imageSize =
    args.aspect === "16:9"
      ? "landscape_16_9"
      : args.aspect === "1:1"
        ? "square_hd"
        : "portrait_16_9";

  const submit = await fetch("https://queue.fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: args.prompt,
      negative_prompt: args.negativePrompt,
      image_size: imageSize,
      num_images: 1,
    }),
  });
  if (!submit.ok) {
    throw new Error(`Fal submit failed (${submit.status})`);
  }
  const queued = (await submit.json()) as FalQueueStatus;
  const requestId = queued.request_id ?? "unknown";
  const result = await pollFalResult<FalImageResult>(
    requestId,
    key,
    "fal-ai/flux/schnell",
  );
  const url = result.images?.[0]?.url ?? result.image?.url;
  if (!url) {
    throw new Error("Fal returned no image URL");
  }
  return { url, requestId };
}

export async function falTts(text: string): Promise<{ url: string }> {
  const key = process.env.FAL_KEY;
  if (!key) {
    throw new Error("FAL_KEY is not set");
  }
  const submit = await fetch("https://queue.fal.run/fal-ai/kokoro/american-english", {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: text,
      voice: "af_heart",
    }),
  });
  if (!submit.ok) {
    throw new Error(`Fal TTS submit failed (${submit.status})`);
  }
  const queued = (await submit.json()) as FalQueueStatus;
  const requestId = queued.request_id ?? "unknown";
  const result = await pollFalResult<{ audio?: { url?: string }; audio_url?: string }>(
    requestId,
    key,
    "fal-ai/kokoro/american-english",
  );
  const url = result.audio?.url ?? result.audio_url;
  if (!url) {
    throw new Error("Fal TTS returned no audio URL");
  }
  return { url };
}

async function pollFalResult<T>(
  requestId: string,
  key: string,
  model: string,
): Promise<T> {
  const statusUrl = `https://queue.fal.run/${model}/requests/${requestId}/status`;
  const resultUrl = `https://queue.fal.run/${model}/requests/${requestId}`;
  for (let i = 0; i < 40; i += 1) {
    const statusRes = await fetch(statusUrl, {
      headers: { Authorization: `Key ${key}` },
    });
    const status = (await statusRes.json()) as FalQueueStatus;
    if (status.status === "COMPLETED") {
      const resultRes = await fetch(resultUrl, {
        headers: { Authorization: `Key ${key}` },
      });
      if (!resultRes.ok) {
        throw new Error(`Fal result fetch failed (${resultRes.status})`);
      }
      return (await resultRes.json()) as T;
    }
    if (status.status === "FAILED") {
      throw new Error("Fal generation failed");
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("Fal queue timeout");
}

export async function fetchToBytes(url: string): Promise<{ bytes: ArrayBuffer; contentType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not download generated media (${response.status})`);
  }
  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const bytes = await response.arrayBuffer();
  return { bytes, contentType };
}
