import type AnimObject from "./animObject.ts";
import type AnimUtil from "./animUtil.ts";

export type AnimFunction<S, T extends Array<AnimObject>> = (
    animUtil: AnimUtil<S>,
    ...animObjects: T
) => Promise<void>;
