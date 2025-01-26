import AnimManager from "./animManager.ts";
import type AnimObject from "./animObject.ts";
import AnimRunner from "./animRunner.ts";
import CanvasManager from "./canvas.ts";
import CanvasStateManager from "./state.ts";

export interface AnimBuilder {
    withState<T>(startState: T): AnimBuilderWithState<T>;
}

export interface AnimBuilderWithState<T> {
    withDimensions(width: number, height: number): void;
    addAnim(animObject: AnimObject): void;
    build(): AnimManager<T>;
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

    withState<T>(startState: T) {
        return new AnimBuilderObjectWithState<T>(
            this.canvasManager,
            startState,
        );
    }
}

export class AnimBuilderObjectWithState<T> implements AnimBuilderWithState<T> {
    dims: { width: number; height: number };
    stateManager: CanvasStateManager<T>;
    canvasManager: CanvasManager;
    anims: Array<AnimObject>;

    constructor(canvasManager: CanvasManager, startState: T) {
        this.canvasManager = canvasManager;
        this.stateManager = new CanvasStateManager<T>(startState);

        //defaults
        this.dims = { width: 500, height: 300 };
        this.anims = [];
    }

    addAnim(animObject: AnimObject): void {
        this.anims.push(animObject);
    }

    withDimensions(width: number, height: number): void {
        this.dims = { width, height };
    }

    build(): AnimManager<T> {
        const animRunner = new AnimRunner();
        this.anims.forEach((a) => animRunner.addAnim(a));

        const animManager = new AnimManager(
            animRunner,
            this.canvasManager,
            this.stateManager,
        );
        return animManager;
    }
}

class CanvasNotFoundError extends Error {
    constructor(id: string) {
        super(`Couldn't find canvas with id ${id}`);
    }
}
