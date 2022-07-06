import { Http } from "./deps.ts";

const PORT = 8080;
const decodeBytes = (bytes: Uint8Array) =>
  new TextDecoder().decode(bytes).trim();

async function convertToPDF(request: Request) {
  const html = await request.text();
  const tempInput = await Deno.makeTempFile({ suffix: ".html" });
  const tempOutput = await Deno.makeTempFile({ suffix: ".pdf" });

  await Deno.writeTextFile(tempInput, html);

  {
    const proc = Deno.run({
      cmd: [
        "./node_modules/.bin/pagedjs-cli",
        "--noSandbox",
        tempInput,
        "-o",
        `${tempOutput}`,
      ],
    });
    const status = await proc.status();

    if (!status.success) {
      console.error(decodeBytes(await proc.stderrOutput()));
      return new Response("", { status: 500 });
    }
  }

  const file = await Deno.readFile(tempOutput);

  return new Response(file, {
    headers: { "content-type": "application/pdf" },
    status: 200,
  });
}

function convertHtml(request: Request, params: URLSearchParams) {
  switch (request.method === "POST" && params.get("format")) {
    case "pdf":
      return convertToPDF(request);
  }
  return new Response("", { status: 400 });
}

const handler = (request: Request): Promise<Response> | Response => {
  const { pathname, searchParams } = new URL(request.url);

  if (pathname === "/convert") {
    return convertHtml(request, searchParams);
  }

  return new Response("", { status: 404 });
};

await Http.serve(handler, { port: PORT });

console.log(`kf-press running at 0.0.0.0:${PORT}`);
