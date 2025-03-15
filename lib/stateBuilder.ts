import type AnimObject from "./animObject.ts";
import type AnimObjectInfo from "./animObjectInfo.ts";
import type AnimUtil from "./animUtil.ts";
import { AnimRunBuilderType } from "./builder.ts";
import StateAnims from "./stateAnims.ts";
import { addToMapArray } from "./util/mapUtil.ts";

/** Create anim associated with a state */
export function createAnimForState(): AnimStateBuilder {
    return new AnimStateBuilder();
}

/** Builder object for creating an anim */
export class AnimStateBuilder {
    // i can't figure out a better way to do this, sometimes i hate typescript...
    // deno-lint-ignore no-explicit-any
    #anims: Array<AnimObjectInfo<any>>;
    #events: Map<
        StateEventEnum,
        Array<(animUtil: AnimUtil, stateAnims: StateAnims) => void>
    >;

    animRunBuilderType: typeof AnimRunBuilderType.AnimStateBuilder =
        AnimRunBuilderType.AnimStateBuilder;

    constructor() {
        this.#anims = [];
        this.#events = new Map();
    }

    /** Adds an anim to be run */
    addAnim<T extends Array<AnimObject>>(
        anim: AnimObjectInfo<T>,
    ): this {
        this.#anims.push(anim);
        return this;
    }

    /**
     * Adds an event to the animState to be run when an event occurs
     * @param event The state event to trigger the event on
     * @param callback The function to callback when the event occurs
     */
    addEventListener(
        event: StateEventEnum,
        callback: (animUtil: AnimUtil, stateAnims: StateAnims) => void,
    ): this {
        addToMapArray(this.#events, event, callback);
        return this;
    }

    /**
     * Removes an event from the animState
     * @param type The state event to remove the event fror
     * @param callback The function to remove from the animState
     * @returns Whether the event was removed
     */
    removeEventListener(
        type: StateEventEnum,
        callback: (animUtil: AnimUtil) => void,
    ): this {
        const eventArray = this.#events.get(type);

        if (eventArray) {
            for (let index = eventArray.length - 1; index >= 0; index--) {
                if (eventArray[index] == callback) {
                    eventArray.splice(index, 1);
                }
            }
        }

        return this;
    }

    /** Builds the AnimState for use in the AnimBuilder */
    build(): StateAnims {
        return new StateAnims(
            this.#anims,
            this.#events,
        );
    }
}

/** Events for states to run code on them */
export const StateEvent = {
    /** Runs when a state starts */
    Start: 0,
    /** Runs when a state ends */
    End: 1,
    /** Runs when a state has all its animations completed */
    AnimsCompleted: 2,
} as const;
export type StateEventEnum = typeof StateEvent[keyof typeof StateEvent];
