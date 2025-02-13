import type AnimInterpInfo from "./animInterp.ts";
import type AnimRunner from "./animRunner.ts";
import AnimTimer from "./animTimer.ts";
import AnimUtil from "./animUtil.ts";
import type CanvasManager from "./canvas.ts";
import type CanvasStateManager from "./state.ts";
import type StateAnims from "./stateAnims.ts";
import { StateEventEnum } from "./stateBuilder.ts";

class AnimManager<S> {
    animRunner: AnimRunner;
    canvasManager: CanvasManager;
    canvasStateManager: CanvasStateManager<S>;
    stateAnimations: Map<S, StateAnims<S>>;

    subAnimManagers: Array<AnimManager<unknown>>;

    // not passed in
    animTimer: AnimTimer;
    animUtil: AnimUtil<S>;
    interpAnimations: Array<AnimInterpInfo>;

    constructor(
        animRunner: AnimRunner,
        canvasManager: CanvasManager,
        canvasStateManager: CanvasStateManager<S>,
        stateAnimations: Map<S, StateAnims<S>>,
        subAnimManagers: Array<AnimManager<unknown>>,
    ) {
        this.animRunner = animRunner;
        this.canvasManager = canvasManager;
        this.canvasStateManager = canvasStateManager;
        this.stateAnimations = stateAnimations;
        this.subAnimManagers = subAnimManagers;

        this.animTimer = new AnimTimer();
        this.animUtil = new AnimUtil<S>(this);
        this.interpAnimations = [];
    }

    /** Starts the animation */
    public start() {
        const startState = this.canvasStateManager.currentState;

        this.startState(startState);

        globalThis.requestAnimationFrame(this.update.bind(this));
    }

    private startState(newState: S) {
        const stateAnimations = this.stateAnimations.get(newState);

        if (stateAnimations) {
            stateAnimations.runEvents(StateEventEnum.Start, this.animUtil);

            for (const anim of stateAnimations.anims) {
                const animObject = anim.getAnimObject();
                const context = this.canvasManager.getContext();
                if (animObject.start) {
                    animObject.start(context);
                }
                this.animRunner.addAnimObject(animObject);
                anim.run(this.animUtil);
            }
        }
    }

    private endState(currentState: S) {
        // on end of state, kill all running anims
        this.animTimer.cancelAnims();
        for (const interpAnim of this.interpAnimations) {
            interpAnim.cancelFunction();
        }
        this.interpAnimations = [];

        const stateAnimations = this.stateAnimations.get(currentState);

        if (stateAnimations) {
            stateAnimations.runEvents(StateEventEnum.End, this.animUtil);
        }
    }

    /** Main update loop */
    private update() {
        const deltaTime = this.animTimer.updateAndGetDeltaTime();

        // update interpolated animations
        for (
            let index = this.interpAnimations.length - 1;
            index >= 0;
            index--
        ) {
            const animInterp = this.interpAnimations[index];

            animInterp.update(deltaTime);

            if (animInterp.isCompleted()) {
                animInterp.completeFunction();
                this.interpAnimations.splice(index, 1);
            }
        }
        // check for completed anims
        const currentState = this.canvasStateManager.currentState;
        const animState = this.stateAnimations.get(currentState);
        if (animState) {
            if (animState.checkJustCompletedAnims()) {
                animState.runEvents(
                    StateEventEnum.AnimsCompleted,
                    this.animUtil,
                );
            }
        }

        this.canvasManager.clearCanvas();

        const context = this.canvasManager.getContext();

        // draw anim objects
        this.animRunner.draw(context);

        // re-call update
        globalThis.requestAnimationFrame(this.update.bind(this));
    }

    public waitTime(timeToWait: number): Promise<void> {
        return this.animTimer.waitTime(timeToWait);
    }

    public addInterp(animInterpInfo: AnimInterpInfo) {
        this.interpAnimations.push(animInterpInfo);
    }

    public setState(newState: S) {
        if (this.canvasStateManager.currentState !== newState) {
            this.endState(this.canvasStateManager.currentState);
            this.startState(newState);
            this.canvasStateManager.setState(newState);
        }
    }

    public setZoomPoint(zoomAmount: number, x: number, y: number) {
        this.animRunner.setZoomPoint(zoomAmount, x, y);
    }
}
export default AnimManager;
