import AnimManager from "./animManager.ts";
import { AnimMode, type AnimModeEnum, DEFAULT_ANIMMODE } from "./animMode.ts";
import AnimRunner from "./animRunner.ts";
import AnimTimer from "./animTimer.ts";
import type AnimUtil from "./animUtil.ts";
import CanvasManager from "./canvasManager.ts";
import StateManager from "./stateManager.ts";
import type StateAnims from "./stateAnims.ts";
import {
    type AnimStateBuilder,
    StateEvent,
    type StateEventEnum,
} from "./stateBuilder.ts";
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
    | AnimBuilder
    | AnimStateBuilder;

/** Types of anim runs during building */
export const AnimRunBuilderType = {
    AnimBuilderWithState: 0,
    AnimStateBuilder: 1,
} as const;
export type AnimRunBuilderTypeEnum =
    typeof AnimRunBuilderType[keyof typeof AnimRunBuilderType];

/** Anim to be run is either a sub manager or a set of anims for the state */
export type AnimRun =
    | AnimManager
    | StateAnims;

/** Types of anim runs */
export const AnimRunType = {
    AnimManager: 0,
    StateAnims: 1,
} as const;
export type AnimRunTypeEnum = typeof AnimRunType[keyof typeof AnimRunType];

/** Interface for an anim builder */
export interface AnimBuilder {
    /** Sets the dimensions for the canvas */
    withDimensions(width: number, height: number): this;

    /** Add an anim to be run during the state passed in */
    addAnimRunToState(
        state: string,
        animRun: AnimRunBuilder,
    ): this;

    /** Build the anim using the id of the canvas */
    build(canvasId: string): AnimManager;

    /** Used internally to build up the anim managers */
    buildSubManager(
        canvasManager: CanvasManager,
        animTimer: AnimTimer,
        depth: number,
        animMode: AnimModeEnum,
    ): AnimManager;

    /** Explicitly set the order of the states to be run, otherwise will use implicit order */
    setStateOrder(
        states: Array<string>,
    ): this;

    /** Sets the anim mode of the animation */
    setAnimMode(
        animMode: AnimModeEnum,
    ): this;

    /** Add an event to be run when an event occurs with the callback passed in */
    addEventListener(
        event: AnimManagerEventEnum,
        callback: (animUtil: AnimUtil, animManager: AnimManager) => void,
    ): this;

    addEventListenerAll(
        event: AnimRunEventEnum,
        callback: (animUtil: AnimUtil, animRun: AnimRun) => void,
    ): this;

    /** For internal usage to determine the type of anim run */
    animRunBuilderType: typeof AnimRunBuilderType.AnimBuilderWithState;
}

/** Events for states to run code on them */
export const AnimManagerEvent = {
    /** When the manager finishes with the states it has to run through */
    ManagerEnd: 0,
    /** When the manager is started */
    ManagerStart: 1,
} as const;
export type AnimManagerEventEnum =
    typeof AnimManagerEvent[keyof typeof AnimManagerEvent];

/** For creating an animation */
export function createAnim(): AnimBuilder {
    return new AnimBuilderObject();
}

/** Events for both animrun */
export const AnimRunEvent = {
    OnEnd: 0,
    OnStart: 1,
} as const;
export type AnimRunEventEnum = typeof AnimRunEvent[keyof typeof AnimRunEvent];

function mapAnimRunEventToAnimManagerEvent(
    animRunEvent: AnimRunEventEnum,
): AnimManagerEventEnum {
    switch (animRunEvent) {
        case AnimRunEvent.OnEnd:
            return AnimManagerEvent.ManagerEnd;
        case AnimRunEvent.OnStart:
            return AnimManagerEvent.ManagerStart;
    }
}

function mapAnimRunEventToStateEvent(
    animRunEvent: AnimRunEventEnum,
): StateEventEnum {
    switch (animRunEvent) {
        case AnimRunEvent.OnEnd:
            return StateEvent.AnimsCompleted;
        case AnimRunEvent.OnStart:
            return StateEvent.Start;
    }
}

/** Object for building the animations */
export class AnimBuilderObject implements AnimBuilder {
    dims: DimsType;
    animRunBuilders: Map<string, AnimRunBuilder>;
    animMode: AnimModeEnum | null;

    animRunBuilderType = AnimRunBuilderType.AnimBuilderWithState;

    // state order stuff
    explicitStateOrder: boolean;
    stateOrder: Array<string>;

    // events to be run
    events: Map<
        AnimManagerEventEnum,
        Array<(animUtil: AnimUtil, animManager: AnimManager) => void>
    >;

    /**
     * @param startState The state to begin the animation on
     * @param dims The dimensions of the canvas
     */
    constructor() {
        this.dims = DEFAULT_DIMS;

        //defaults
        this.animMode = null;
        this.explicitStateOrder = false;
        this.stateOrder = [];
        this.animRunBuilders = new Map();

        this.events = new Map();
    }

    /** Sets the animmode of the animation */
    setAnimMode(animMode: AnimModeEnum): this {
        this.animMode = animMode;
        return this;
    }

    /**
     * Adds an anim that can be run to the animation being built.
     * If state is not set explicitly then
     */
    addAnimRunToState(
        state: string,
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
        states: Array<string>,
    ): this {
        this.stateOrder = states;
        this.explicitStateOrder = true;
        return this;
    }

    /** Add event to builder */
    addEventListener(
        event: AnimManagerEventEnum,
        callback: (animUtil: AnimUtil, animManager: AnimManager) => void,
    ): this {
        addToMapArray(this.events, event, callback);
        return this;
    }

    /** Adds event to all managers and anims */
    addEventListenerAll(
        event: AnimRunEventEnum,
        callback: (animUtil: AnimUtil, animRun: AnimRun) => void,
    ): this {
        const nodes: Array<AnimRunBuilder> = [this];

        while (nodes.length > 0) {
            const currentNode: AnimRunBuilder = nodes.pop()!;
            switch (currentNode.animRunBuilderType) {
                case AnimRunBuilderType.AnimBuilderWithState: {
                    const animBuilderEvent = mapAnimRunEventToAnimManagerEvent(
                        event,
                    );
                    currentNode.addEventListener(
                        animBuilderEvent,
                        callback,
                    );
                    nodes.push(
                        ...(<AnimBuilderObject> currentNode)
                            .animRunBuilders.values(),
                    );
                    break;
                }
                case AnimRunBuilderType.AnimStateBuilder: {
                    const animStateEvent = mapAnimRunEventToStateEvent(event);
                    currentNode.addEventListener(
                        animStateEvent,
                        callback,
                    );
                    break;
                }
            }
        }

        return this;
    }

    /** Builds the animation and creates an AnimManager */
    build(canvasId: string): AnimManager {
        const canvasManager = createCanvasManager(canvasId, this.dims);
        const animTimer = new AnimTimer();
        const animMode = this.animMode ?? DEFAULT_ANIMMODE;

        return this.#buildManager(canvasManager, animTimer, 0, animMode);
    }

    /** Builds a sub manager, used internally */
    buildSubManager(
        canvasManager: CanvasManager,
        animTimer: AnimTimer,
        depth: number,
        animModeParent: AnimModeEnum,
    ): AnimManager {
        const animMode = this.animMode ?? animModeParent;
        return this.#buildManager(canvasManager, animTimer, depth, animMode);
    }

    /** Build up the manager */
    #buildManager(
        canvasManager: CanvasManager,
        animTimer: AnimTimer,
        depth: number,
        animMode: AnimModeEnum,
    ): AnimManager {
        const animRunner = new AnimRunner();
        const stateManager = new StateManager(
            this.stateOrder,
        );

        const animRuns: Map<string, AnimRun> = new Map();
        const animManagersToSet: Array<AnimManager> = [];

        for (const [state, animRun] of this.animRunBuilders) {
            switch (animRun.animRunBuilderType) {
                case AnimRunBuilderType.AnimBuilderWithState: {
                    if (animMode === AnimMode.Automatic) {
                        animRun.addEventListener(
                            AnimManagerEvent.ManagerEnd,
                            (animUtil) => {
                                const parentAnimUtil = animUtil
                                    .getParentAnimUtil();
                                parentAnimUtil?.nextState();
                            },
                        );
                    }

                    const subManager = animRun
                        .buildSubManager(
                            canvasManager,
                            animTimer,
                            depth + 1,
                            animMode,
                        );
                    animManagersToSet.push(subManager);

                    animRuns.set(
                        state,
                        subManager,
                    );
                    break;
                }
                case AnimRunBuilderType.AnimStateBuilder: {
                    if (animMode === AnimMode.Automatic) {
                        animRun.addEventListener(
                            StateEvent.AnimsCompleted,
                            (animUtil) => {
                                animUtil.nextState();
                            },
                        );
                    }
                    animRuns.set(state, animRun.build());
                    break;
                }
            }
        }

        const animManager = new AnimManager(
            animRunner,
            canvasManager,
            stateManager,
            animRuns,
            animTimer,
            this.events,
            depth,
            animMode,
        );

        animManagersToSet.forEach((manager) =>
            manager.parentAnimManager = animManager
        );

        return animManager;
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
