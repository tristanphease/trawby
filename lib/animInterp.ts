import type { AnimKeyframe } from "./keyframe.ts";

/** Info about an anim interp */
export default class AnimInterpInfo {
    keyFrames: Array<AnimKeyframe>;
    totalTime: number;
    callbackFunction: (value: number) => void;

    completeFunction: () => void;
    cancelFunction: () => void;
    /** Time through the anim is, between 0 and 1 */
    timeThrough: number;

    constructor(
        keyFrames: Array<AnimKeyframe>,
        totalTime: number,
        callbackFn: (value: number) => void,
        completeFunction: () => void,
        cancelFunction: () => void,
    ) {
        this.keyFrames = keyFrames;
        this.totalTime = totalTime;
        this.callbackFunction = callbackFn;

        this.completeFunction = completeFunction;
        this.cancelFunction = cancelFunction;
        this.timeThrough = 0;
    }

    /** Whether the interp anim is completed */
    isCompleted(): boolean {
        return this.timeThrough >= 1;
    }

    /** Update the interp with new values */
    update(deltaTime: number) {
        this.timeThrough += deltaTime / this.totalTime;

        const currentValue = this.#getCurrentValue();
        this.callbackFunction(currentValue);
    }

    #getCurrentValue(): number {
        let firstKeyframe: AnimKeyframe | null = null;
        let lastKeyframe: AnimKeyframe | null = null;

        let currentKeyframe = this.keyFrames[0];
        for (const keyframe of this.keyFrames) {
            if (keyframe.distanceThrough >= this.timeThrough) {
                firstKeyframe = currentKeyframe;
                lastKeyframe = keyframe;
                break;
            }
            currentKeyframe = keyframe;
        }

        if (firstKeyframe === null || lastKeyframe === null) {
            firstKeyframe = currentKeyframe;
            lastKeyframe = currentKeyframe;
        }

        if (
            firstKeyframe === lastKeyframe ||
            firstKeyframe.value === lastKeyframe.value
        ) {
            return firstKeyframe.value;
        }

        // lerp between keyframes

        const keyFrameDistance = lastKeyframe.distanceThrough -
            firstKeyframe.distanceThrough;
        const normalisedDistance =
            (this.timeThrough - firstKeyframe.distanceThrough) /
            keyFrameDistance;

        const value = normalisedDistance * lastKeyframe.value +
            (1.0 - normalisedDistance) * firstKeyframe.value;

        return value;
    }
}
