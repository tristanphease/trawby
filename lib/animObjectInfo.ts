import type { AnimFunction } from "./animFunction.ts";
import type AnimObject from "./animObject.ts";
import type AnimUtil from "./animUtil.ts";

/** Class for creating an anim on some object(s) */
export default class AnimObjectInfo<S, T extends Array<AnimObject>> {
    #animObjects: T;
    #animFunctions: Array<AnimFunction<S, T>>;
    #completedAnims: number;

    /** Create a new anim object info, pass through as many anim objects as you want for the anims */
    constructor(...animObjects: T) {
        this.#animObjects = animObjects;
        this.#animFunctions = [];
        this.#completedAnims = 0;
    }

    /** Add anim to be run, each one will be run in parallel */
    withAnim(animFunction: AnimFunction<S, T>): this {
        this.#animFunctions.push(animFunction);
        return this;
    }

    /** get all the anim objects */
    getAnimObjects(): T {
        return this.#animObjects;
    }

    /** Run the anim object */
    run(animUtil: AnimUtil<S>) {
        for (const animFunction of this.#animFunctions) {
            animFunction(animUtil, ...this.#animObjects)
                .then(() => this.#completedAnims += 1)
                .catch((error) => {
                    if (error.isCancelled) {
                        // ignore this since we're just cancelling
                    } else {
                        console.error("Error found in animation: ", error);
                    }
                });
        }
    }

    /** Whether the anim object info has completed */
    hasCompletedAnims(): boolean {
        return this.#completedAnims === this.#animFunctions.length;
    }
}
