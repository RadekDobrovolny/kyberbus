import { createEventStream } from "h3";
import { requireUser } from "~~/server/utils/auth";
import { registerFeedStream } from "~~/server/utils/feed-events";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const stream = createEventStream(event);

  registerFeedStream(stream);

  await stream.push({
    event: "ready",
    data: JSON.stringify({ ok: true, userId: user.id })
  });

  const keepAlive = setInterval(() => {
    stream.push({ event: "ping", data: String(Date.now()) }).catch(() => {
      clearInterval(keepAlive);
    });
  }, 25000);

  stream.onClosed(async () => {
    clearInterval(keepAlive);
    await stream.close();
  });

  return stream.send();
});
