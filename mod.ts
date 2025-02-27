/**
 * Trawby, a neat little animation library for building cool animations on the canvas with javascript
 * Find info on the [jsr page](https://jsr.io/@trawby/trawby)
 *
 * ```ts
 * import { createAnim } from "@trawby/trawby";
 *
 * const animManager = createAnim()
 *      .withState("state1")
 *      .withDimensions(1000, 800)
 *      .addAnimRunToState("state1", getAnimRun())
 *      .build("canvasId");
 *
 * animManager.start();
 *
 * ```
 *
 * @module
 */

export { createAnim } from "./lib/builder.ts";

export type {
    AnimBuilderObjectWithState,
    AnimBuilderWithState,
} from "./lib/builder.ts";

export {
    AnimStateBuilder,
    createAnimForState,
    StateEventEnum,
} from "./lib/stateBuilder.ts";

export type { AnimFunction } from "./lib/animFunction.ts";

export { default as AnimManager } from "./lib/animManager.ts";

export type { AnimObjects, default as AnimObject } from "./lib/animObject.ts";

export { default as AnimUtil } from "./lib/animUtil.ts";

export { default as AnimObjectInfo } from "./lib/animObjectInfo.ts";

export { createKeyframes } from "./lib/keyframe.ts";

export { default as PixelGrid } from "./lib/objects/pixelGrid.ts";

export {
    colorFromHex,
    default as Color,
    getRandomColor,
} from "./lib/util/color.ts";
