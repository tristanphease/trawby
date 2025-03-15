import AnimInterpInfo from "./animInterp.ts";
import type AnimManager from "./animManager.ts";
import type { AnimKeyframe } from "./keyframe.ts";

/** Util class for doing animations */
export default class AnimUtil {
    #animManager: AnimManager;

    constructor(animManager: AnimManager) {
        this.#animManager = animManager;
    }

    /* waits for the time provided in milliseconds */
    waitTime(timeInMs: number): Promise<void> {
        return this.#animManager.waitTime(timeInMs);
    }

    /**
     * Interp using keyframes for a value
     * @param keyframes keyframes for a value, can be created using createKeyframes()
     * @param timeTaken time it takes for the interp to complete in milliseconds
     * @param callbackFn the function that returns the value being interpolated
     * @returns promise that completes when the interp is finished
     */
    interp(
        keyframes: Array<AnimKeyframe>,
        timeTaken: number,
        callbackFn: (value: number) => void,
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const animInterp = new AnimInterpInfo(
                keyframes,
                timeTaken,
                callbackFn,
                () => {
                    resolve();
                },
                () => {
                    reject(new AnimCancelled());
                },
            );
            this.#animManager.addInterp(animInterp);
        });
    }

    /**
     * Function for zooming in and out of the canvas
     * @param zoomAmount Amount to zoom to
     * @param x x value of point to zoom on
     * @param y y value of point to zoom on
     */
    setZoomPoint(zoomAmount: number, x: number, y: number) {
        this.#animManager.setZoomPoint(zoomAmount, x, y);
    }

    /**
     * Sets the state, will cancel all running anims and continue with the anim as it is
     * @param newState
     */
    setState(newState: string) {
        this.#animManager.setState(newState);
    }

    /**
     * Moves along to the next state.\
     * If on an animstate, moves to the next state according to the parent anim manager.\
     * If on an anim manager, moves to the next state according to this
     */
    nextState() {
        this.#animManager.nextState();
    }

    /**
     * Gets the parent of the animutil
     */
    getParentAnimUtil(): AnimUtil | null {
        return this.#animManager.parentAnimManager?.animUtil ?? null;
    }
}

/** Object to be used in rejection when an animation is cancelled */
export class AnimCancelled {
    isCancelled: true = true;
}
