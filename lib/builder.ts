import AnimManager from "./animManager.ts";
import AnimRunner from "./animRunner.ts";
import CanvasManager from "./canvas.ts";
import CanvasStateManager from "./state.ts";
import type { AnimStateBuilder } from "./stateBuilder.ts";

const DEFAULT_DIMS = {
    width: 500,
    height: 300,
};

type DimsType = {
    width: number;
    height: number;
};

interface AnimBuilderBase {
    withDimensions(width: number, height: number): this;
}

interface AnimBuilder extends AnimBuilderBase {
    withState<S>(startState: S): AnimBuilderWithState<S>;
}

interface AnimBuilderWithState<S> extends AnimBuilderBase {
    addStateAnims(
        stateAnims: AnimStateBuilder<S>,
    ): this;

    addSubBuilder(subBuilder: AnimBuilderWithState<unknown>): this;

    build(canvasId: string): AnimManager<S>;
}

/** Object for building the animations */
export class AnimBuilderObject implements AnimBuilder {
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
    public withState<S>(startState: S) {
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
    stateAnims: Map<S, AnimStateBuilder<S>>;
    subBuilders: Array<AnimBuilderWithState<unknown>>;

    constructor(startState: S, dims: DimsType) {
        this.startState = startState;
        this.dims = dims;

        //defaults
        this.stateAnims = new Map();
        this.subBuilders = [];
    }
    addSubBuilder(subBuilder: AnimBuilderWithState<unknown>): this {
        this.subBuilders.push(subBuilder);
        return this;
    }

    /** Adds the state anims to the animation being built */
    addStateAnims(
        stateAnims: AnimStateBuilder<S>,
    ): this {
        this.stateAnims.set(stateAnims.state, stateAnims);
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
        const animRunner = new AnimRunner();

        const canvasManager = createCanvasManager(canvasId, this.dims);

        const stateManager = new CanvasStateManager<S>(this.startState);

        const stateAnims = new Map();
        for (const [state, animStateBuilder] of this.stateAnims) {
            stateAnims.set(state, animStateBuilder.build());
        }

        const subAnimManagers: Array<AnimManager<unknown>> = [];
        for (const subBuilder of this.subBuilders) {
            subAnimManagers.push(subBuilder.build(canvasId));
        }

        const animManager = new AnimManager(
            animRunner,
            canvasManager,
            stateManager,
            stateAnims,
            subAnimManagers,
        );
        return animManager;
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
