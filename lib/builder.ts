import type AnimObjectInfo from "./animObjectInfo.ts";
import AnimManager from "./animManager.ts";
import AnimRunner from "./animRunner.ts";
import CanvasManager from "./canvas.ts";
import CanvasStateManager from "./state.ts";
import type AnimObject from "./animObject.ts";
import StateAnims from "./stateAnims.ts";

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

export function createAnim(canvasId: string): AnimBuilder {
    return new AnimBuilderObject(canvasId);
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
    stateAnims: Map<S, AnimStateBuilder<S>>;

    constructor(canvasManager: CanvasManager, startState: S) {
        this.canvasManager = canvasManager;
        this.stateManager = new CanvasStateManager<S>(startState);

        //defaults
        this.dims = { width: 500, height: 300 };
        this.stateAnims = new Map();
    }

    addStateAnims(
        stateAnims: AnimStateBuilder<S>,
    ): AnimBuilderObjectWithState<S> {
        this.stateAnims.set(stateAnims.state, stateAnims);
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

export class AnimStateBuilder<S> {
    anims: Array<AnimObjectInfo<S, AnimObject>>;
    state: S;
    events: Map<StateEventEnum, Array<() => void>>;

    constructor(state: S) {
        this.state = state;
        this.anims = [];
        this.events = new Map();
    }

    addAnim(
        anim: AnimObjectInfo<S, AnimObject>,
    ): AnimStateBuilder<S> {
        this.anims.push(anim);
        return this;
    }

    addEventListener(
        type: StateEventEnum,
        callback: () => void,
    ): void {
        if (this.events.has(type)) {
            this.events.set(type, [callback]);
        } else {
            const eventArray = this.events.get(type);
            eventArray?.push(callback);
        }
    }

    removeEventListener(
        type: StateEventEnum,
        callback: () => void,
    ): void {
        const eventArray = this.events.get(type);

        if (eventArray) {
            for (let index = eventArray.length - 1; index >= 0; index--) {
                if (eventArray[index] == callback) {
                    eventArray.splice(index, 1);
                }
            }
        }
    }

    build(): StateAnims<S> {
        const startAnims = this.events.get(StateEventEnum.Start) ?? [];
        const endAnims = this.events.get(StateEventEnum.End) ?? [];
        return new StateAnims<S>(
            this.state,
            this.anims,
            startAnims,
            endAnims,
        );
    }
}

export enum StateEventEnum {
    Start,
    End,
}

class CanvasNotFoundError extends Error {
    constructor(id: string) {
        super(`Couldn't find canvas with id ${id}`);
    }
}
