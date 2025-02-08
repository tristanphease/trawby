import type AnimObjectInfo from "./animObjectInfo.ts";
import AnimManager from "./animManager.ts";
import AnimRunner from "./animRunner.ts";
import CanvasManager from "./canvas.ts";
import CanvasStateManager from "./state.ts";
import type AnimObject from "./animObject.ts";

export interface AnimBuilder {
    withState<T>(startState: T): AnimBuilderWithState<T>;
}

export interface AnimBuilderWithState<S> {
    withDimensions(width: number, height: number): AnimBuilderWithState<S>;
    addAnim(anim: AnimObjectInfo<S, AnimObject>): AnimBuilderWithState<S>;
    build(): AnimManager<S>;
}

export class AnimBuilderObject implements AnimBuilder {
    canvasManager: CanvasManager;

    constructor(canvasId: string) {
        const canvas = <HTMLCanvasElement> document.getElementById(canvasId);
        if (!canvas || canvas.tagName !== "CANVAS") {
            throw new CanvasNotFoundError(canvasId);
        }

        this.canvasManager = new CanvasManager(canvas);
    }

    withState<S>(startState: S) {
        return new AnimBuilderObjectWithState<S>(
            this.canvasManager,
            startState,
        );
    }
}

export class AnimBuilderObjectWithState<S> implements AnimBuilderWithState<S> {
    dims: { width: number; height: number };
    stateManager: CanvasStateManager<S>;
    canvasManager: CanvasManager;
    anims: Array<AnimObjectInfo<S, AnimObject>>;

    constructor(canvasManager: CanvasManager, startState: S) {
        this.canvasManager = canvasManager;
        this.stateManager = new CanvasStateManager<S>(startState);

        //defaults
        this.dims = { width: 500, height: 300 };
        this.anims = [];
    }

    addAnim(
        anim: AnimObjectInfo<S, AnimObject>,
    ): AnimBuilderObjectWithState<S> {
        this.anims.push(anim);
        return this;
    }

    withDimensions(
        width: number,
        height: number,
    ): AnimBuilderObjectWithState<S> {
        this.dims = { width, height };
        return this;
    }

    build(): AnimManager<S> {
        const animRunner = new AnimRunner();

        this.canvasManager.setDimensions(this.dims.width, this.dims.height);

        const animManager = new AnimManager(
            animRunner,
            this.canvasManager,
            this.stateManager,
            this.anims,
        );
        return animManager;
    }
}

class CanvasNotFoundError extends Error {
    constructor(id: string) {
        super(`Couldn't find canvas with id ${id}`);
    }
}
