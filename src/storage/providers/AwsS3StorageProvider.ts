import type { S3 } from "aws-sdk";
import { ReadStream } from "fs";
import { Maybe } from "../../utils.js";
import { StorageProvider } from "../StorageProvider.js";
import { StorageProviderRegistry } from "../StorageProviderRegistry.js";

export class AWSS3StorageProvider extends StorageProvider {
  static key = "AWS-S3";

  static {
    StorageProviderRegistry.set(this.key, () => new AWSS3StorageProvider());
  }

  #config;
  #s3: Maybe<Promise<S3>>;

  constructor() {
    super();
    const bucket = this.env("AWS_S3_BUCKET");
    const region = this.env("AWS_S3_REGION");
    const accessKeyId = this.env("AWS_S3_ACCESS_KEY_ID");
    const secretAccessKey = this.env("AWS_S3_SECRET_ACCESS_KEY");
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
