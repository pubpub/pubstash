import { ReadStream } from "fs";
import { assert } from "../debug";
import { has } from "../utils";
import { StorageProviderRegistry } from "./StorageProviderRegistry";

class NotImplementedException extends Error {
  name = "NotImplementedException";
}

export class StorageProvider {
  static key: string;
  static {
    StorageProviderRegistry.set(this.key, () => new this());
  }

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
