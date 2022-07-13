import Router from "@koa/router";
import * as Proc from "child_process";
import { createReadStream } from "fs";
import { writeFile } from "fs/promises";
import Koa from "koa";
import koaBody from "koa-body";
import { temporaryFile } from "tempy";
import { promisify } from "util";
import { assert } from "./debug";
import { StorageRegistry } from "./storage";

const storageKind = process.env.STORAGE_KIND;
assert(
  storageKind !== undefined,
  "STORAGE_KIND environment variable is required"
);
const storageFactory = StorageRegistry.get(storageKind);
assert(storageFactory !== undefined, "Invalid STORAGE_KIND");
const storage = storageFactory();
const port = process.env.PORT ? Number(process.env.PORT) : 8080;
const exec = promisify(Proc.exec);

function createKey(length = 32) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  for (let index = 0; index < length; index += 1) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

async function uploadToStorage(path: string) {
  const key = createKey();
  const stream = createReadStream(path);
  return await storage.upload(key, stream);
}

class InternalError extends Error {
  name = "InternalError";
}

function spawnPagedProcess(inputFile: string, outputFile: string) {
  return exec(
    `./node_modules/.bin/pagedjs-cli --noSandbox ${inputFile} -o ${outputFile}`
  );
}

async function runPaged(inputFile: string, outputFile: string) {
  try {
    await spawnPagedProcess(inputFile, outputFile);
    return true;
  } catch (_) {
    console.error(_);
    return false;
  }
}

async function convertToPDF(html: string) {
  const tempInputFilePath = temporaryFile({ extension: ".html" });
  const tempOutputFilePath = temporaryFile({ extension: ".pdf" });

  await writeFile(tempInputFilePath, html);

  const pagedSucceeded = await runPaged(tempInputFilePath, tempOutputFilePath);

  if (!pagedSucceeded) {
    throw new InternalError("There was a problem converting HTML to PDF.");
  }

  try {
    return uploadToStorage(tempOutputFilePath);
  } catch (_) {
    console.error(_);
    throw new InternalError("There was a problem uploading the file to S3.");
  }
}
const app = new Koa();
const router = new Router();

router.post("/convert", koaBody(), async (ctx) => {
  switch (ctx.query.format) {
    case "pdf": {
      try {
        const url = await convertToPDF(ctx.request.body);
        ctx.response.body = { url };
      } catch ({ message }) {
        ctx.response.body = { error: message };
        ctx.response.status = 500;
      }
    }
  }
  ctx.response.status = 404;
});

// if (process.env.NODE_ENV === "production") {
//   // The Sentry request handler must be the first middleware on the app
//   Sentry.init({
//     dsn: "https://abe1c84bbb3045bd982f9fea7407efaa@sentry.io/1505439",
//     environment: isProd() ? "prod" : "dev",
//     release: getAppCommit(),
//   });
//   app.use(Sentry.Handlers.requestHandler({ user: ["id", "slug"] }));
//   app.use(enforce.HTTPS({ trustProtoHeader: true }));
// }

app.use(router.routes()).use(router.allowedMethods()).listen(port);

console.log(`kf-press running at 0.0.0.0:${port}`);
