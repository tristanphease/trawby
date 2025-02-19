import AnimManager from "./animManager.ts";
import AnimRunner from "./animRunner.ts";
import AnimTimer from "./animTimer.ts";
import CanvasManager from "./canvas.ts";
import CanvasStateManager from "./state.ts";
import type StateAnims from "./stateAnims.ts";
import type { AnimStateBuilder } from "./stateBuilder.ts";

const DEFAULT_DIMS = {
    width: 500,
    height: 300,
};

type DimsType = {
    width: number;
    height: number;
};

// ignoring any here since i can't use unknown...
/** An anim that can be run in a state */
type AnimRunBuilder =
    // deno-lint-ignore no-explicit-any
    | AnimBuilderWithState<any>
    // deno-lint-ignore no-explicit-any
    | AnimStateBuilder<any>;

export enum AnimRunBuilderType {
    AnimBuilderWithState,
    AnimStateBuilder,
}

export type AnimRun =
    | AnimManager<unknown>
    | StateAnims<unknown>;

export enum AnimRunType {
    AnimManager,
    StateAnims,
}

interface AnimBuilderBase {
    /** Sets the dimensions for the canvas */
    withDimensions(width: number, height: number): this;
}

export interface AnimBuilder extends AnimBuilderBase {
    /** Sets the states */
    withState<S>(startState: S): AnimBuilderWithState<S>;
}

export interface AnimBuilderWithState<S> extends AnimBuilderBase {
    addAnimRunToState(
        state: S,
        animRun: AnimRunBuilder,
    ): this;

    build(canvasId: string): AnimManager<S>;

    /** Used internally to build up the anim managers */
    buildSubManager(
        canvasManager: CanvasManager,
        animTimer: AnimTimer,
    ): AnimManager<S>;

    animRunBuilderType: AnimRunBuilderType.AnimBuilderWithState;
}

/** For creating an animation */
export function createAnim(): AnimBuilder {
    return new AnimBuilderObject();
}

/** Object for building the animations */
class AnimBuilderObject implements AnimBuilder {
    dims: DimsType;

    constructor() {
        this.dims = DEFAULT_DIMS;
    }

    withDimensions(width: number, height: number): this {
        this.dims = {
            width,
            height,
        };
        return this;
    }

    /** Creates the states that the builder functions for. */
    public withState<S>(startState: S): AnimBuilderWithState<S> {
        return new AnimBuilderObjectWithState<S>(
            startState,
            this.dims,
        );
    }
}

/** Object for building the animations with a defined state */
export class AnimBuilderObjectWithState<S> implements AnimBuilderWithState<S> {
    dims: DimsType;
    startState: S;
    animRunBuilders: Map<S, AnimRunBuilder>;

    animRunBuilderType: AnimRunBuilderType.AnimBuilderWithState =
        AnimRunBuilderType.AnimBuilderWithState;

    //TODO
    stateOrder: Array<S>;

    constructor(startState: S, dims: DimsType) {
        this.startState = startState;
        this.dims = dims;

        //defaults
        this.animRunBuilders = new Map();

        this.stateOrder = [];
    }

    /** Adds an anim that can be run to the animation being built */
    addAnimRunToState(
        state: S,
        animRun: AnimRunBuilder,
    ): this {
        this.animRunBuilders.set(state, animRun);
        return this;
    }

    /** Sets the canvas dimensions to the values provided */
    withDimensions(
        width: number,
        height: number,
    ): this {
        this.dims = { width, height };
        return this;
    }

    /** Builds the animation and creates an AnimManager */
    build(canvasId: string): AnimManager<S> {
        const canvasManager = createCanvasManager(canvasId, this.dims);
        const animTimer = new AnimTimer();

        return this.buildManager(canvasManager, animTimer);
    }

    buildSubManager(
        canvasManager: CanvasManager,
        animTimer: AnimTimer,
    ): AnimManager<S> {
        return this.buildManager(canvasManager, animTimer);
    }

    private buildManager(
        canvasManager: CanvasManager,
        animTimer: AnimTimer,
    ): AnimManager<S> {
        const animRunner = new AnimRunner();
        const stateManager = new CanvasStateManager<S>(this.startState);

        const animRuns: Map<S, AnimRun> = new Map();

        for (const [state, animRun] of this.animRunBuilders) {
            switch (animRun.animRunBuilderType) {
                case AnimRunBuilderType.AnimBuilderWithState:
                    animRuns.set(
                        state,
                        animRun
                            .buildSubManager(
                                canvasManager,
                                animTimer,
                            ),
                    );
                    break;
                case AnimRunBuilderType.AnimStateBuilder:
                    animRuns.set(state, animRun.build());
                    break;
            }
        }

        return new AnimManager(
            animRunner,
            canvasManager,
            stateManager,
            animRuns,
            animTimer,
        );
    }
}

function createCanvasManager(canvasId: string, dims: DimsType) {
    const canvas = <HTMLCanvasElement> document.getElementById(canvasId);
    if (!canvas || canvas.tagName !== "CANVAS") {
        throw new CanvasNotFoundError(canvasId);
    }

    const canvasManager = new CanvasManager(canvas);

    canvasManager.setDimensions(dims.width, dims.height);

    return canvasManager;
}

/** Error when the canvas with the id provided can't be found */
class CanvasNotFoundError extends Error {
    constructor(id: string) {
        super(`Couldn't find canvas with id ${id}`);
    }
}
