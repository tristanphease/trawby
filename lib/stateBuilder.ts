import type AnimObject from "./animObject.ts";
import type AnimObjectInfo from "./animObjectInfo.ts";
import type AnimUtil from "./animUtil.ts";
import { AnimRunBuilderType } from "./builder.ts";
import StateAnims from "./stateAnims.ts";

/** Builder object for creating an anim */
export class AnimStateBuilder<S> {
    // i can't figure out a better way to do this, sometimes i hate typescript...
    // deno-lint-ignore no-explicit-any
    private anims: Array<AnimObjectInfo<S, any>>;
    state: S;
    events: Map<StateEventEnum, Array<(animUtil: AnimUtil<S>) => void>>;

    animRunBuilderType: AnimRunBuilderType.AnimStateBuilder =
        AnimRunBuilderType.AnimStateBuilder;

    constructor(state: S) {
        this.anims = [];
        this.state = state;
        this.events = new Map();
    }

    /** Adds an anim to be run */
    addAnim<T extends AnimObject>(
        anim: AnimObjectInfo<S, T>,
    ): this {
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
