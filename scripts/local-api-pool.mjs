import http from "node:http";

// Acceptance only: bounded PHP worker model on Windows, not a deployment server.
let next = 0;
const ports = Array.from({ length: 8 }, (_, index) => 8010 + index);
const server = http.createServer((incoming, outgoing) => {
  const port = ports[next++ % ports.length];
  const request = http.request(
    {
      hostname: "127.0.0.1",
      port,
      path: incoming.url,
      method: incoming.method,
      headers: { ...incoming.headers, host: `127.0.0.1:${port}` },
    },
    (response) => {
      outgoing.writeHead(response.statusCode ?? 502, response.headers);
      response.pipe(outgoing);
    },
  );
  request.setTimeout(5000, () => request.destroy());
  request.on("error", () => {
    if (!outgoing.headersSent) outgoing.writeHead(503);
    outgoing.end("Local worker unavailable");
  });
  incoming.pipe(request);
});
server.listen(8801, "127.0.0.1", () =>
  process.stdout.write("Local acceptance pool: 127.0.0.1:8801 (8 workers)\n"),
);
