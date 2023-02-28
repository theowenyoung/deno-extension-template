import * as esbuild from "https://deno.land/x/esbuild@v0.17.2/mod.js";
export { esbuild };

// std
export {
  assert,
  assertEquals,
  assertStrictEquals,
  assertThrows,
} from "https://deno.land/std@0.177.0/testing/asserts.ts";
export {
  assertSpyCall,
  assertSpyCalls,
  spy,
  stub,
} from "https://deno.land/std@0.177.0/testing/mock.ts";
export * as fs from "https://deno.land/std@0.177.0/fs/mod.ts";
export * as path from "https://deno.land/std@0.177.0/path/mod.ts";
export { FakeTime } from "https://deno.land/std@0.165.0/testing/time.ts";
