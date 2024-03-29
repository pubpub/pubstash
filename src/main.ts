import Router from "@koa/router";
import * as Proc from "child_process";
import { createReadStream } from "fs";
import Koa, { Context, Next } from "koa";
import koaBody from "koa-body";
import { temporaryFileTask, temporaryWriteTask } from "tempy";
import { promisify } from "util";
import { installSentry } from "./sentry.js";
import { StorageProviderRegistry } from "./storage/index.js";
import { has, Maybe } from "./utils.js";

let conversionCount = 0;

class InvalidParameterError extends Error {
  name = "InvalidParameterError";
  status = 400;
}

class InvalidAccessKeyError extends Error {
  name = "InvalidAccessKeyError";
  status = 401;
}

const accessKey = process.env.ACCESS_KEY;
const convertBodyLimit = process.env.CONVERT_BODY_LIMIT
  ? Number(process.env.CONVERT_BODY_LIMIT)
  : 5e7;
const storageProviderKey = process.env.STORAGE_PROVIDER;
const storageProviderFactory = StorageProviderRegistry.get(storageProviderKey!);
const storageProvider = storageProviderFactory();
const port = process.env.PORT ? Number(process.env.PORT) : 8080;
const exec = promisify(Proc.exec);

function createStorageKey(length = 32) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  for (let index = 0; index < length; index += 1) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

async function uploadToStorage(path: string, suffix = "") {
  const key = createStorageKey();
  const stream = createReadStream(path);
  return storageProvider.upload(`${key}${suffix}`, stream);
}

function spawnPagedProcess(inputFile: string, outputFile: string) {
  return exec(
    `./node_modules/.bin/pagedjs-cli --noSandbox ${inputFile} -o ${outputFile}`
  );
}

async function convertToPDF(html: string) {
  return temporaryWriteTask(html, async (tempInputFilePath) => {
    return temporaryFileTask(async (tempOutputFilePath) => {
      await spawnPagedProcess(tempInputFilePath, tempOutputFilePath);
      return uploadToStorage(tempOutputFilePath, ".pdf");
    }, { extension: ".pdf" });
  }, { extension: ".html" });
}
const app = new Koa();
const router = new Router();

function accessKeyAuth(key: Maybe<string>) {
  return function accessKeyMiddleware(ctx: Context, next: Next) {
    if (has(key) && key !== "" && ctx.request.get("Authorization") !== key) {
      throw new InvalidAccessKeyError();
    }
    return next();
  };
}

router
  .get("/", (ctx) => {
    ctx.set("Content-Type", "text/html; charset=UTF-8");
    ctx.body = `<html>
  <head>
    <title>pubstash</title>
  </head>
  <body>
    <p>pubstash</p>
  </body>
</html>`;
  })
  .post(
    "/convert",
    accessKeyAuth(accessKey),
    koaBody({ textLimit: convertBodyLimit }),
    async (ctx) => {
      const id = conversionCount++;
      const start = performance.now();
      console.log(
        `convert start ${id} format=${ctx.query.format} byte_length=${ctx.request.length}`
      );
      try {
        switch (ctx.query.format) {
          case "pdf": {
            const url = await convertToPDF(ctx.request.body);
            ctx.body = { url };
            break;
          }
          default:
            throw new InvalidParameterError(
              "Missing or unsupported query parameter: format"
            );
        }
      } catch (error) {
        console.log(
          `convert failure ${id} duration=${(
            (performance.now() - start) /
            1000
          ).toFixed(3)}s`
        );
        throw error;
      }
      console.log(
        `convert success ${id} duration=${(
          (performance.now() - start) /
          1000
        ).toFixed(3)}s`
      );
    }
  );

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

console.log(`pubstash running at 0.0.0.0:${port}`);
