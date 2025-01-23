// main exports go here

import { type AnimBuilder, AnimBuilderObject } from "./lib/builder.ts";

export function createAnim(canvasId: string): AnimBuilder {
  return new AnimBuilderObject(canvasId);
}

import type AnimObject from "./lib/animObject.ts";
export type { AnimObject };
