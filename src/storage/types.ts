import { ReadStream } from "fs";

export interface Storage {
  upload(key: string, readStream: ReadStream): Promise<string>;
}
