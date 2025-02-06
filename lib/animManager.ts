import type AnimInterpInfo from "./animInterp.ts";
import type AnimObject from "./animObject.ts";
import type AnimObjectInfo from "./animObjectInfo.ts";
import type AnimRunner from "./animRunner.ts";
import AnimTimer from "./animTimer.ts";
import AnimUtil from "./animUtil.ts";
import type CanvasManager from "./canvas.ts";
import type CanvasStateManager from "./state.ts";

class AnimManager<S> {
    animRunner: AnimRunner;
    canvasManager: CanvasManager;
    canvasStateManager: CanvasStateManager<S>;
    animations: Array<AnimObjectInfo<S, AnimObject>>;

    // not passed in
    animTimer: AnimTimer;
    animUtil: AnimUtil<S>;
    interpAnimations: Array<AnimInterpInfo>;

    constructor(
        animRunner: AnimRunner,
        canvasManager: CanvasManager,
        canvasStateManager: CanvasStateManager<S>,
        animations: Array<AnimObjectInfo<S, AnimObject>>,
    ) {
        this.animRunner = animRunner;
        this.canvasManager = canvasManager;
        this.canvasStateManager = canvasStateManager;
        this.animations = animations;

        this.animTimer = new AnimTimer();
        this.animUtil = new AnimUtil<S>(this);
        this.interpAnimations = [];
    }

    start() {
        for (const anim of this.animations) {
            this.animRunner.addAnim(anim.getAnimObject());
            anim.run(this.animUtil);
        }

        globalThis.requestAnimationFrame(this.update.bind(this));
    }

    update() {
        const context = this.canvasManager.getContext();

        const deltaTime = this.animTimer.updateAndGetDeltaTime();

        // updates
        for (
            let index = this.interpAnimations.length - 1;
            index >= 0;
            index--
        ) {
            const animInterp = this.interpAnimations[index];

            animInterp.update(deltaTime);

            if (animInterp.isCompleted()) {
                this.interpAnimations.splice(index, 1);
            }
        }

        // draw anim objects
        this.animRunner.draw(context);

        // re-call update
        globalThis.requestAnimationFrame(this.update.bind(this));
    }

    addInterp(animInterpInfo: AnimInterpInfo) {
        this.interpAnimations.push(animInterpInfo);
    }

    setState(newState: S) {
        this.canvasStateManager.setState(newState);
    }
}
export default AnimManager;
