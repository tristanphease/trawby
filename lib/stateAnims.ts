import type AnimObject from "./animObject.ts";
import type AnimObjectInfo from "./animObjectInfo.ts";
import type AnimUtil from "./animUtil.ts";

export default class StateAnims<S> {
    state: S;
    anims: Array<AnimObjectInfo<S, AnimObject>>;
    onStart: Array<(animUtil: AnimUtil<S>) => void>;
    onEnd: Array<(animUtil: AnimUtil<S>) => void>;

    constructor(
        state: S,
        anims: Array<AnimObjectInfo<S, AnimObject>>,
        onStart: Array<(animUtil: AnimUtil<S>) => void>,
        onEnd: Array<(animUtil: AnimUtil<S>) => void>,
    ) {
        this.state = state;
        this.anims = anims;
        this.onStart = onStart;
        this.onEnd = onEnd;
    }
}
