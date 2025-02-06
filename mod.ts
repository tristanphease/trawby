// main exports go here

import { type AnimBuilder, AnimBuilderObject } from "./lib/builder.ts";

export function createAnim(canvasId: string): AnimBuilder {
    return new AnimBuilderObject(canvasId);
}

export type { default as AnimObject } from "./lib/animObject.ts";

export { default as AnimUtil } from "./lib/animUtil.ts";

export { default as AnimObjectInfo } from "./lib/animObjectInfo.ts";

export { createKeyframes } from "./lib/keyframe.ts";
