import type { EventStream } from "h3";

type FeedUpdateKind = "created" | "updated" | "deleted";

declare global {
  // eslint-disable-next-line no-var
  var __kyberbusFeedStreams: Set<EventStream> | undefined;
}

const getFeedStreams = () => {
  if (!globalThis.__kyberbusFeedStreams) {
    globalThis.__kyberbusFeedStreams = new Set<EventStream>();
  }
  return globalThis.__kyberbusFeedStreams;
};

const pushWithTimeout = async (
  stream: EventStream,
  data: string,
  timeoutMs = 1500
) => {
  const pushTask = stream
    .push({ event: "feed-update", data })
    .then(() => true)
    .catch(() => false);

  const timeoutTask = new Promise<boolean>((resolve) => {
    setTimeout(() => resolve(false), timeoutMs);
  });

  return Promise.race([pushTask, timeoutTask]);
};

export const registerFeedStream = (stream: EventStream) => {
  const streams = getFeedStreams();
  streams.add(stream);
  console.info(`[feed-sse] stream registered; active=${streams.size}`);
  stream.onClosed(() => {
    streams.delete(stream);
    console.info(`[feed-sse] stream closed; active=${streams.size}`);
  });
};

export const publishFeedUpdate = (kind: FeedUpdateKind, postId: string) => {
  const payload = JSON.stringify({
    kind,
    postId,
    ts: Date.now()
  });

  const streams = getFeedStreams();
  if (streams.size === 0) {
    console.info(`[feed-sse] publish ${kind} ${postId}; no active streams`);
    return;
  }
  console.info(`[feed-sse] publish ${kind} ${postId}; streams=${streams.size}`);

  void (async () => {
    const streamList = Array.from(streams);
    const results = await Promise.all(
      streamList.map((stream) => pushWithTimeout(stream, payload))
    );

    for (let i = 0; i < streamList.length; i++) {
      const stream = streamList[i];
      if (!stream) {
        continue;
      }
      if (!results[i]) {
        streams.delete(stream);
      }
    }
  })();
};
