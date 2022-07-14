import { ReadStream } from "fs";
import { assert } from "../debug.js";
import { has } from "../utils.js";

class NotImplementedException extends Error {
  name = "NotImplementedException";
}

export class StorageProvider {
  static key: string;

  async upload(key: string, stream: ReadStream): Promise<string> {
    throw new NotImplementedException(
      "Missing implementation for abstract member upload"
    );
  }

  env(name: string) {
    const value = process.env[name];
    assert(
      has(value),
      `Failed to initialize ${
        (this.constructor as typeof StorageProvider).key
      } storage provider: missing environment variable ${name}`
    );
    return value;
  }
}
