import type AnimInterpInfo from "./animInterp.ts";
import type AnimRunner from "./animRunner.ts";
import AnimTimer from "./animTimer.ts";
import AnimUtil from "./animUtil.ts";
import type CanvasManager from "./canvas.ts";
import type CanvasStateManager from "./state.ts";
import type StateAnims from "./stateAnims.ts";

class AnimManager<S> {
    animRunner: AnimRunner;
    canvasManager: CanvasManager;
    canvasStateManager: CanvasStateManager<S>;
    stateAnimations: Map<S, StateAnims<S>>;

    // not passed in
    animTimer: AnimTimer;
    animUtil: AnimUtil<S>;
    interpAnimations: Array<AnimInterpInfo>;

    constructor(
        animRunner: AnimRunner,
        canvasManager: CanvasManager,
        canvasStateManager: CanvasStateManager<S>,
        stateAnimations: Map<S, StateAnims<S>>,
    ) {
        this.animRunner = animRunner;
        this.canvasManager = canvasManager;
        this.canvasStateManager = canvasStateManager;
        this.stateAnimations = stateAnimations;

        this.animTimer = new AnimTimer();
        this.animUtil = new AnimUtil<S>(this);
        this.interpAnimations = [];
    }

    start() {
        const startState = this.canvasStateManager.currentState;

        this.startState(startState);

        globalThis.requestAnimationFrame(this.update.bind(this));
    }

    private startState(newState: S) {
        const stateAnimations = this.stateAnimations.get(newState);

        if (stateAnimations) {
            for (const onStartFunction of stateAnimations.onStart) {
                onStartFunction(this.animUtil);
            }

            for (const anim of stateAnimations.anims) {
                const animObject = anim.getAnimObject();
                const context = this.canvasManager.getContext();
                if (animObject.start) {
                    animObject.start(context);
                }
                this.animRunner.addAnim(animObject);
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
            for (const onEndFunction of stateAnimations.onEnd) {
                onEndFunction(this.animUtil);
            }
        }
    }

    update() {
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
                animInterp.completeFunction();
                this.interpAnimations.splice(index, 1);
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
