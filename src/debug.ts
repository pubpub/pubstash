export function assert(condition: boolean, message: string): asserts condition {
  if (condition === false) {
    throw new Error(message);
  }
}
