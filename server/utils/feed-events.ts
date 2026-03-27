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

export const registerFeedStream = (stream: EventStream) => {
  const streams = getFeedStreams();
  streams.add(stream);
  stream.onClosed(() => {
    streams.delete(stream);
  });
};

export const publishFeedUpdate = async (kind: FeedUpdateKind, postId: string) => {
  const payload = JSON.stringify({
    kind,
    postId,
    ts: Date.now()
  });

  const streams = getFeedStreams();
  if (streams.size === 0) {
    return;
  }

  const failed: EventStream[] = [];
  await Promise.all(
    Array.from(streams).map(async (stream) => {
      try {
        await stream.push({ event: "feed-update", data: payload });
      } catch {
        failed.push(stream);
      }
    })
  );

  for (const stream of failed) {
    streams.delete(stream);
  }
};
