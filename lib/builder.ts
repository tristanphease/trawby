import { StateEventEnum } from "../mod.ts";
import AnimManager from "./animManager.ts";
import AnimRunner from "./animRunner.ts";
import AnimTimer from "./animTimer.ts";
import type AnimUtil from "./animUtil.ts";
import CanvasManager from "./canvasManager.ts";
import CanvasStateManager from "./state.ts";
import type StateAnims from "./stateAnims.ts";
import type { AnimStateBuilder } from "./stateBuilder.ts";
import { addToMapArray } from "./util/mapUtil.ts";

/** Default values for the dimensions */
const DEFAULT_DIMS = {
    width: 500,
    height: 300,
};

/** The dimensions of the canvas */
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

/** Types of anim runs during building */
export enum AnimRunBuilderType {
    AnimBuilderWithState,
    AnimStateBuilder,
}

/** Anim to be run is either a sub manager or a set of anims for the state */
export type AnimRun =
    | AnimManager<unknown>
    | StateAnims<unknown>;

/** Types of anim runs */
export enum AnimRunType {
    AnimManager,
    StateAnims,
}

/** The base of the anim builder */
interface AnimBuilderBase {
    /** Sets the dimensions for the canvas */
    withDimensions(width: number, height: number): this;
}

/** The anim builder */
export interface AnimBuilder extends AnimBuilderBase {
    /** Sets the states */
    withState<S>(startState: S): AnimBuilderWithState<S>;
}

/** Interface for an anim builder */
export interface AnimBuilderWithState<S> extends AnimBuilderBase {
    /** Add an anim to be run during the state passed in */
    addAnimRunToState(
        state: S,
        animRun: AnimRunBuilder,
    ): this;

    /** Build the anim using the id of the canvas */
    build(canvasId: string): AnimManager<S>;

    /** Used internally to build up the anim managers */
    buildSubManager(
        canvasManager: CanvasManager,
        animTimer: AnimTimer,
        depth: number,
    ): AnimManager<S>;

    /** Explicitly set the order of the states to be run, otherwise will use implicit order */
    setStateOrder(
        states: Array<S>,
    ): this;

    /** Add an event to be run when an event occurs with the callback passed in */
    addEventListener(
        event: AnimManagerEventEnum,
        callback: (animUtil: AnimUtil<S>) => void,
    ): this;

    /** For internal usage to determine the type of anim run */
    animRunBuilderType: AnimRunBuilderType.AnimBuilderWithState;
}

/** Events for states to run code on them */
export enum AnimManagerEventEnum {
    /** When the manager finishes with the states it has to run through */
    ManagerEnd,
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
    withState<S>(startState: S): AnimBuilderWithState<S> {
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

    // state order stuff
    explicitStateOrder: boolean;
    stateOrder: Array<S>;

    // events to be run
    events: Map<
        AnimManagerEventEnum,
        Array<(animUtil: AnimUtil<unknown>) => void>
    >;

    /**
     * @param startState The state to begin the animation on
     * @param dims The dimensions of the canvas
     */
    constructor(startState: S, dims: DimsType) {
        this.startState = startState;
        this.dims = dims;

        //defaults
        this.animRunBuilders = new Map();

        this.explicitStateOrder = false;
        this.stateOrder = [];

        this.events = new Map();
    }

    /**
     * Adds an anim that can be run to the animation being built.
     * If state is not set explicitly then
     */
    addAnimRunToState(
        state: S,
        animRun: AnimRunBuilder,
    ): this {
        this.animRunBuilders.set(state, animRun);

        if (!this.explicitStateOrder) {
            // set state order implicitly based on order they're added
            // todo remove any existing values for state in array
            this.stateOrder.push(state);
        }
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

    /** Explicitly set the order of the states, overriding the default order */
    setStateOrder(
        states: Array<S>,
    ): this {
        this.stateOrder = states;
        this.explicitStateOrder = true;
        return this;
    }

    /** Add event to builder */
    addEventListener<PS>(
        event: AnimManagerEventEnum,
        callback: (animUtil: AnimUtil<PS>) => void,
    ): this {
        addToMapArray(this.events, event, callback);
        return this;
    }

    /** Builds the animation and creates an AnimManager */
    build(canvasId: string): AnimManager<S> {
        const canvasManager = createCanvasManager(canvasId, this.dims);
        const animTimer = new AnimTimer();

        return this.#buildManager(canvasManager, animTimer, 0);
    }

    /** Builds a sub manager, used internally */
    buildSubManager(
        canvasManager: CanvasManager,
        animTimer: AnimTimer,
        depth: number,
    ): AnimManager<S> {
        return this.#buildManager(canvasManager, animTimer, depth);
    }

    /** Build up the manager */
    #buildManager(
        canvasManager: CanvasManager,
        animTimer: AnimTimer,
        depth: number,
    ): AnimManager<S> {
        const animRunner = new AnimRunner();
        const stateManager = new CanvasStateManager<S>(this.startState);

        const animRuns: Map<S, AnimRun> = new Map();

        for (const [state, animRun] of this.animRunBuilders) {
            switch (animRun.animRunBuilderType) {
                case AnimRunBuilderType.AnimBuilderWithState: {
                    const index = this.stateOrder.indexOf(state);
                    // if index isn't last one in array
                    if (index < this.stateOrder.length - 1) {
                        const nextState = this.stateOrder[index + 1];
                        animRun.addEventListener(
                            AnimManagerEventEnum.ManagerEnd,
                            (animUtil) => {
                                animUtil.setState(nextState);
                            },
                        );
                    }

                    animRuns.set(
                        state,
                        animRun
                            .buildSubManager(
                                canvasManager,
                                animTimer,
                                depth + 1,
                            ),
                    );
                    break;
                }
                case AnimRunBuilderType.AnimStateBuilder: {
                    const index = this.stateOrder.indexOf(state);
                    // if index isn't last one in array
                    if (index < this.stateOrder.length - 1) {
                        const nextState = this.stateOrder[index + 1];
                        animRun.addEventListener(
                            StateEventEnum.AnimsCompleted,
                            (animUtil) => {
                                animUtil.setState(nextState);
                            },
                        );
                    } else {
                        // final one in array
                        animRun.addEventListener(
                            StateEventEnum.AnimsCompleted,
                            (animUtil) => {
                                // want to run manager end at this point
                                animUtil.endManager();
                            },
                        );
                    }
                    animRuns.set(state, animRun.build());
                    break;
                }
            }
        }

        return new AnimManager(
            animRunner,
            canvasManager,
            stateManager,
            animRuns,
            animTimer,
            this.events,
            depth,
        );
    }
}

/** Create the canvas manager from the canvas and dimensions */
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
