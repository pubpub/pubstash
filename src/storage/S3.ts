import type { S3 } from "aws-sdk";
import { ReadStream } from "fs";
import { assert } from "../debug.js";
import { has, Maybe } from "../utils.js";
import { StorageRegistry } from "./registry.js";
import { Storage } from "./types.js";

export class AWSS3Storage implements Storage {
  static {
    StorageRegistry.set("AWS-S3", () => new AWSS3Storage());
  }

  #config;
  #s3: Maybe<Promise<S3>>;

  constructor() {
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_S3_REGION;
    const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;
    assert(has(region), "Missing environment variable: AWS_S3_REGION");
    assert(
      has(accessKeyId),
      "Missing environment variable: AWS_S3_ACCESS_KEY_ID"
    );
    assert(
      has(secretAccessKey),
      "Missing environment variable: AWS_S3_SECRET_ACCESS_KEY"
    );
    assert(has(bucket), "Missing environment variable: AWS_S3_BUCKET");
    this.#config = {
      bucket,
      region,
      accessKeyId,
      secretAccessKey,
      baseUrl:
        process.env.AWS_S3_ASSET_PROXY ?? `https://s3.amazonaws.com/${bucket}`,
    };
  }

  async s3() {
    return (this.#s3 ??= import("aws-sdk").then(
      ({ default: { S3 } }) =>
        new S3({
          region: this.#config.region,
          credentials: {
            accessKeyId: this.#config.accessKeyId,
            secretAccessKey: this.#config.secretAccessKey,
          },
        })
    ));
  }

  async upload(key: string, stream: ReadStream) {
    const s3 = await this.s3();
    await s3
      .putObject({
        ACL: "public-read",
        Key: key,
        Body: stream,
        Bucket: this.#config.bucket,
      })
      .promise();
    return `${this.#config.baseUrl}/${key}`;
  }
}
