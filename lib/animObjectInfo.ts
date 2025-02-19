import type { AnimFunction } from "./animFunction.ts";
import type AnimObject from "./animObject.ts";
import type AnimUtil from "./animUtil.ts";

class AnimObjectInfo<S, T extends AnimObject> {
    private animObject: T;
    private animFunctions: Array<AnimFunction<S, T>>;
    private completedAnims: number;

    constructor(animObject: T) {
        this.animObject = animObject;
        this.animFunctions = [];
        this.completedAnims = 0;
    }

    public withAnim(animFunction: AnimFunction<S, T>): this {
        this.animFunctions.push(animFunction);
        return this;
    }

    public getAnimObject(): AnimObject {
        return this.animObject;
    }

    public run(animUtil: AnimUtil<S>) {
        for (const animFunction of this.animFunctions) {
            animFunction(this.animObject, animUtil)
                .then(() => this.completedAnims += 1)
                .catch((error) => {
                    if (error.isCancelled) {
                        // ignore this since we're just cancelling
                    } else {
                        console.error("Error found in animation: ", error);
                    }
                });
        }
    }

    public hasCompletedAnims(): boolean {
        return this.completedAnims === this.animFunctions.length;
    }
}

export default AnimObjectInfo;
