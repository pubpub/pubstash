import Router from "@koa/router";
import * as Proc from "child_process";
import { createReadStream } from "fs";
import { writeFile } from "fs/promises";
import Koa from "koa";
import koaBody from "koa-body";
import { temporaryFile } from "tempy";
import { promisify } from "util";
import { assert } from "./debug.js";
import { installSentry } from "./sentry.js";
import { StorageRegistry } from "./storage/index.js";

const storageProvider = process.env.STORAGE_PROVIDER;
assert(
  storageProvider !== undefined,
  "STORAGE_PROVIDER environment variable is required"
);
const storageFactory = StorageRegistry.get(storageProvider);
assert(storageFactory !== undefined, "Invalid STORAGE_PROVIDER");
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

class InvalidParameterError extends Error {
  name = "InvalidParameterError";
  status = 400;
}

function spawnPagedProcess(inputFile: string, outputFile: string) {
  return exec(
    `./node_modules/.bin/pagedjs-cli --noSandbox ${inputFile} -o ${outputFile}`
  );
}

async function convertToPDF(html: string) {
  const tempInputFilePath = temporaryFile({ extension: ".html" });
  const tempOutputFilePath = temporaryFile({ extension: ".pdf" });
  await writeFile(tempInputFilePath, html);
  await spawnPagedProcess(tempInputFilePath, tempOutputFilePath);
  return uploadToStorage(tempOutputFilePath);
}
const app = new Koa();
const router = new Router();

router.post("/convert", koaBody(), async (ctx) => {
  switch (ctx.query.format) {
    case "pdf": {
      const url = await convertToPDF(ctx.request.body);
      ctx.response.body = { url };
    }
  }
  throw new InvalidParameterError(
    "Missing or unsupported query parameter: format"
  );
});

app
  .use(async (_, next) => {
    try {
      await next();
    } catch (error) {
      (error as Record<string, unknown>).status ??= 500;
      throw error;
    }
  })
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(port);

if (process.env.NODE_ENV === "production") {
  installSentry(app);
}

console.log(`kf-press running at 0.0.0.0:${port}`);
