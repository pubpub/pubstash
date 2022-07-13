import { Storage } from "./types.js";

export type StorageRegistryKey = string;
export type StorageFactory = () => Storage;

export class StorageRegistry {
  static #storages = new Map<StorageRegistryKey, StorageFactory>();

  static get(key: StorageRegistryKey) {
    return this.#storages.get(key);
  }

  static set(key: StorageRegistryKey, storageFactory: StorageFactory) {
    this.#storages.set(key, storageFactory);
  }
}
