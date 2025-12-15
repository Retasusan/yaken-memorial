// src/types/env.ts
// Minimal D1 typing to satisfy lint without using `any`.
type D1Statement = {
  bind: (...values: (string | number | null | undefined)[]) => D1Statement;
  run: () => Promise<unknown>;
  first: <T = unknown>() => Promise<T | null>;
  all: <T = unknown>() => Promise<{ results: T[] }>;
};

export type D1DatabaseLike = {
  prepare: (query: string) => D1Statement;
};

export interface AppEnv {
  MEMORIAL_IMAGES: R2Bucket;
  MEMORIAL_META: D1DatabaseLike;
}
