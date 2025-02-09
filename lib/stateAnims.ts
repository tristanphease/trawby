import type AnimObject from "./animObject.ts";
import type AnimObjectInfo from "./animObjectInfo.ts";

export default class StateAnims<S> {
    state: S;
    anims: Array<AnimObjectInfo<S, AnimObject>>;
    onStart: Array<() => void>;
    onEnd: Array<() => void>;

    constructor(
        state: S,
        anims: Array<AnimObjectInfo<S, AnimObject>>,
        onStart: Array<() => void>,
        onEnd: Array<() => void>,
    ) {
        this.state = state;
        this.anims = anims;
        this.onStart = onStart;
        this.onEnd = onEnd;
    }
}
