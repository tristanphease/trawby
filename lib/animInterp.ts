import type { AnimKeyframe } from "./keyframe.ts";

class AnimInterpInfo {
    keyFrames: Array<AnimKeyframe>;
    totalTime: number;
    callbackFunction: (value: number) => void;

    completeFunction: () => void;
    cancelFunction: () => void;
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

    public isCompleted(): boolean {
        return this.timeThrough >= this.totalTime;
    }

    public update(deltaTime: number) {
        this.timeThrough += deltaTime / this.totalTime;

        const currentValue = this.getCurrentValue();
        this.callbackFunction(currentValue);
    }

    private getCurrentValue(): number {
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

export default AnimInterpInfo;
