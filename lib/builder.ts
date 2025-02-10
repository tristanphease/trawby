import type AnimObjectInfo from "./animObjectInfo.ts";
import AnimManager from "./animManager.ts";
import AnimRunner from "./animRunner.ts";
import CanvasManager from "./canvas.ts";
import CanvasStateManager from "./state.ts";
import type AnimObject from "./animObject.ts";
import StateAnims from "./stateAnims.ts";
import type AnimUtil from "./animUtil.ts";

export interface AnimBuilder {
    withState<T>(startState: T): AnimBuilderWithState<T>;
}

export interface AnimBuilderWithState<S> {
    withDimensions(width: number, height: number): AnimBuilderWithState<S>;
    addStateAnims(
        stateAnims: AnimStateBuilder<S>,
    ): AnimBuilderObjectWithState<S>;
    build(): AnimManager<S>;
}

/**
 * Creates a builder for creating the animation.
 *
 * Example:
 * ```ts
 * createAnim("canvasId")
 *     .withState<States>(States.StartState)
 *     ...
 * ```
 *
 * @param canvasId the string id for the canvas
 * @returns animBuilder to be used for building up the anim
 */
export function createAnim(canvasId: string): AnimBuilder {
    return new AnimBuilderObject(canvasId);
}

/** Object for building the animations */
export class AnimBuilderObject implements AnimBuilder {
    canvasManager: CanvasManager;

    constructor(canvasId: string) {
        const canvas = <HTMLCanvasElement> document.getElementById(canvasId);
        if (!canvas || canvas.tagName !== "CANVAS") {
            throw new CanvasNotFoundError(canvasId);
        }

        this.canvasManager = new CanvasManager(canvas);
    }

    /** Creates the states that the builder functions for. */
    public withState<S>(startState: S) {
        return new AnimBuilderObjectWithState<S>(
            this.canvasManager,
            startState,
        );
    }
}

/** Object for building the animations with a defined state */
export class AnimBuilderObjectWithState<S> implements AnimBuilderWithState<S> {
    dims: { width: number; height: number };
    stateManager: CanvasStateManager<S>;
    canvasManager: CanvasManager;
    stateAnims: Map<S, AnimStateBuilder<S>>;

    constructor(canvasManager: CanvasManager, startState: S) {
        this.canvasManager = canvasManager;
        this.stateManager = new CanvasStateManager<S>(startState);

        //defaults
        this.dims = { width: 500, height: 300 };
        this.stateAnims = new Map();
    }

    /** Adds the state anims to the animation being built */
    addStateAnims(
        stateAnims: AnimStateBuilder<S>,
    ): AnimBuilderObjectWithState<S> {
        this.stateAnims.set(stateAnims.state, stateAnims);
        return this;
    }

    /** Sets the canvas dimensions to the values provided */
    withDimensions(
        width: number,
        height: number,
    ): AnimBuilderObjectWithState<S> {
        this.dims = { width, height };
        return this;
    }

    /** Builds the animation and creates an AnimManager */
    build(): AnimManager<S> {
        const animRunner = new AnimRunner();

        this.canvasManager.setDimensions(this.dims.width, this.dims.height);

        const stateAnims = new Map();
        for (const [state, animStateBuilder] of this.stateAnims) {
            stateAnims.set(state, animStateBuilder.build());
        }

        const animManager = new AnimManager(
            animRunner,
            this.canvasManager,
            this.stateManager,
            stateAnims,
        );
        return animManager;
    }
}

/** Builder object for creating an anim */
export class AnimStateBuilder<S> {
    anims: Array<AnimObjectInfo<S, AnimObject>>;
    state: S;
    events: Map<StateEventEnum, Array<(animUtil: AnimUtil<S>) => void>>;

    constructor(state: S) {
        this.anims = [];
        this.state = state;
        this.events = new Map();
    }

    /** Adds an anim to be run */
    addAnim(
        anim: AnimObjectInfo<S, AnimObject>,
    ): AnimStateBuilder<S> {
        this.anims.push(anim);
        return this;
    }

    /**
     * Adds an event to the animState to be run when an event occurs
     * @param type The state event to trigger the event on
     * @param callback The function to callback when the event occurs
     */
    addEventListener(
        type: StateEventEnum,
        callback: (animUtil: AnimUtil<S>) => void,
    ): void {
        if (!this.events.has(type)) {
            this.events.set(type, [callback]);
        } else {
            const eventArray = this.events.get(type);
            eventArray!.push(callback);
        }
    }

    /**
     * Removes an event from the animState
     * @param type The state event to remove the event fror
     * @param callback The function to remove from the animState
     * @returns Whether the event was removed
     */
    removeEventListener(
        type: StateEventEnum,
        callback: (animUtil: AnimUtil<S>) => void,
    ): boolean {
        const eventArray = this.events.get(type);

        let removed = false;

        if (eventArray) {
            for (let index = eventArray.length - 1; index >= 0; index--) {
                if (eventArray[index] == callback) {
                    eventArray.splice(index, 1);
                    removed = true;
                }
            }
        }

        return removed;
    }

    /** Builds the AnimState for use in the AnimBuilder */
    build(): StateAnims<S> {
        return new StateAnims<S>(
            this.state,
            this.anims,
            this.events,
        );
    }
}

/** Events for states to run code on them */
export enum StateEventEnum {
    /** When a state starts */
    Start,
    /** When a state ends */
    End,
    /** When a state has all its animations completed */
    AnimsCompleted,
}

/** Error when the canvas with the id provided can't be found */
class CanvasNotFoundError extends Error {
    constructor(id: string) {
        super(`Couldn't find canvas with id ${id}`);
    }
}
