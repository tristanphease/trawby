import type AnimObject from "./animObject.ts";
import type AnimUtil from "./animUtil.ts";

/** the function that performs the animation */
export type AnimFunction<S, T extends AnimObject> = (
    animObject: T,
    animUtil: AnimUtil<S>,
) => Promise<void>;
