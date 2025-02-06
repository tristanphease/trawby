import type { AnimFunction } from "./animFunction.ts";
import type AnimObject from "./animObject.ts";
import type AnimUtil from "./animUtil.ts";

class AnimObjectInfo<S, T extends AnimObject> {
    private animObject: T;
    private animFunctions: Array<AnimFunction<S, T>>;

    constructor(animObject: T) {
        this.animObject = animObject;
        this.animFunctions = [];
    }

    public withAnim(animFunction: AnimFunction<S, T>) {
        this.animFunctions.push(animFunction);
    }

    public getAnimObject(): AnimObject {
        return this.animObject;
    }

    public run(animUtil: AnimUtil<S>) {
        for (const animFunction of this.animFunctions) {
            animFunction(this.animObject, animUtil);
        }
    }
}

export default AnimObjectInfo;
