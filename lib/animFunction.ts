import type AnimObject from "./animObject.ts";
import type AnimUtil from "./animUtil.ts";

/** The main anim function each function should implement */
export type AnimFunction<S, T extends Array<AnimObject>> = (
    animUtil: AnimUtil<S>,
    ...animObjects: T
) => Promise<void>;
