import type AnimObject from "./animObject.ts";
import type AnimObjectInfo from "./animObjectInfo.ts";
import type AnimUtil from "./animUtil.ts";
import { AnimRunType } from "./builder.ts";
import type { StateEventEnum } from "./stateBuilder.ts";

/** A collection of anims to run for a state */
export default class StateAnims<S> {
    anims: Array<AnimObjectInfo<S, Array<AnimObject>>>;
    stateEvents: Map<StateEventEnum, Array<(animUtil: AnimUtil<S>) => void>>;

    animRunType: typeof AnimRunType.StateAnims = AnimRunType.StateAnims;
    completed: boolean;

    constructor(
        anims: Array<AnimObjectInfo<S, Array<AnimObject>>>,
        stateEvents: Map<
            StateEventEnum,
            Array<(animUtil: AnimUtil<S>) => void>
        >,
    ) {
        this.anims = anims;
        this.stateEvents = stateEvents;
        this.completed = false;
    }

    /** Checks if animations have just all completed */
    checkJustCompletedAnims(): boolean {
        if (this.completed) {
            return false;
        }

        for (const anim of this.anims) {
            if (!anim.hasCompletedAnims()) {
                return false;
            }
        }

        this.completed = true;
        return true;
    }

    /** Runs events for the enum as specified */
    runEvents(stateEvent: StateEventEnum, animUtil: AnimUtil<S>) {
        const events = this.stateEvents.get(stateEvent) || [];
        for (const func of events) {
            func(animUtil);
        }
    }
}
