/**
 * Generic High-Performance Object Pool to eliminate Garbage Collection frame drops in Phaser 3.
 */
export class ObjectPool<T> {
  private factory: () => T;
  private resetFn?: (item: T) => void;
  private pool: T[] = [];
  private activeItems: Set<T> = new Set();

  constructor(factory: () => T, resetFn?: (item: T) => void, initialCapacity: number = 20) {
    this.factory = factory;
    this.resetFn = resetFn;

    for (let i = 0; i < initialCapacity; i++) {
      this.pool.push(this.factory());
    }
  }

  /**
   * Retrieves an item from the pool or creates a new one if exhausted.
   */
  public acquire(): T {
    let item: T;
    if (this.pool.length > 0) {
      item = this.pool.pop()!;
    } else {
      item = this.factory();
    }

    if (this.resetFn) {
      this.resetFn(item);
    }

    this.activeItems.add(item);
    return item;
  }

  /**
   * Returns an active item back to the pool for reuse.
   */
  public release(item: T): void {
    if (this.activeItems.has(item)) {
      this.activeItems.delete(item);
      this.pool.push(item);
    }
  }

  /**
   * Releases all currently active objects back to the pool.
   */
  public releaseAll(): void {
    for (const item of this.activeItems) {
      this.pool.push(item);
    }
    this.activeItems.clear();
  }

  public getActiveCount(): number {
    return this.activeItems.size;
  }

  public getAvailableCount(): number {
    return this.pool.length;
  }
}
