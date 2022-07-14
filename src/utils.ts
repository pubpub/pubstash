export type Maybe<T> = T | undefined;
export function has<T>(value: Maybe<T>): value is T {
  return value !== undefined;
}
