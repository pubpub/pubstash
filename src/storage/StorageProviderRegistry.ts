import { assert } from "../debug.js";
import { StorageProvider } from "./StorageProvider.js";

export type StorageProviderRegistryKey = string;
export type StorageProviderFactory = () => StorageProvider;

export class StorageProviderRegistry {
  static #factories = new Map<
    StorageProviderRegistryKey,
    StorageProviderFactory
  >();

  static get(key: StorageProviderRegistryKey) {
    const factory = this.#factories.get(key);
    assert(
      factory !== undefined,
      `Failed to initialize storage provider: invalid provider name ${key}`
    );
    return factory;
  }

  static set(key: StorageProviderRegistryKey, factory: StorageProviderFactory) {
    this.#factories.set(key, factory);
  }
}
