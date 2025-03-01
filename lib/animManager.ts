import type AnimInterpInfo from "./animInterp.ts";
import type AnimRunner from "./animRunner.ts";
import type AnimTimer from "./animTimer.ts";
import AnimUtil from "./animUtil.ts";
import {
    AnimManagerEvent,
    type AnimManagerEventEnum,
    type AnimRun,
    AnimRunType,
} from "./builder.ts";
import type CanvasManager from "./canvasManager.ts";
import type CanvasStateManager from "./state.ts";
import type StateAnims from "./stateAnims.ts";
import { StateEvent } from "./stateBuilder.ts";

export default class AnimManager<S> {
    animRunner: AnimRunner;
    canvasManager: CanvasManager;
    canvasStateManager: CanvasStateManager<S>;
    stateAnimRuns: Map<S, AnimRun>;
    animTimer: AnimTimer;
    events: Map<
        AnimManagerEventEnum,
        Array<(animUtil: AnimUtil<unknown>) => void>
    >;
    depth: number;

    animRunType: typeof AnimRunType.AnimManager = AnimRunType.AnimManager;

    // not passed in
    animUtil: AnimUtil<S>;
    interpAnimations: Array<AnimInterpInfo>;

    runUpdate: boolean;

    constructor(
        animRunner: AnimRunner,
        canvasManager: CanvasManager,
        canvasStateManager: CanvasStateManager<S>,
        stateAnimRuns: Map<S, AnimRun>,
        animTimer: AnimTimer,
        events: Map<
            AnimManagerEventEnum,
            Array<(animUtil: AnimUtil<unknown>) => void>
        >,
        depth: number,
    ) {
        this.animRunner = animRunner;
        this.canvasManager = canvasManager;
        this.canvasStateManager = canvasStateManager;
        this.stateAnimRuns = stateAnimRuns;
        this.animTimer = animTimer;
        this.events = events;
        this.depth = depth;

        this.animUtil = new AnimUtil(this);
        this.interpAnimations = [];
        this.runUpdate = false;
    }

    /** Sets the speed of the animation */
    setSpeed(speed: number) {
        this.animTimer.speed = speed;
    }

    /** Toggles whether the anim timer is paused, returns whether it's paused */
    togglePause(): boolean {
        return this.animTimer.togglePause();
    }

    /** Starts the animation */
    start() {
        const startState = this.canvasStateManager.currentState;

        this.#startState(startState);
    }

    addInterp(animInterpInfo: AnimInterpInfo) {
        this.interpAnimations.push(animInterpInfo);
    }

    #startState(newState: S): void {
        const animRunsForState = this.stateAnimRuns.get(newState);

        if (animRunsForState) {
            switch (animRunsForState.animRunType) {
                case AnimRunType.AnimManager:
                    this.runUpdate = false;
                    animRunsForState.start();
                    break;
                case AnimRunType.StateAnims: {
                    (<StateAnims<S>> animRunsForState).runEvents(
                        StateEvent.Start,
                        this.animUtil,
                    );

                    for (
                        const anim of (<StateAnims<S>> animRunsForState).anims
                    ) {
                        const animObjects = anim.getAnimObjects();
                        const context = this.canvasManager.getContext();
                        for (const animObject of animObjects) {
                            const objectAdded = this.animRunner.addAnimObject(
                                animObject,
                                newState,
                                this.depth,
                            );
                            if (animObject.start && objectAdded) {
                                animObject.start(context);
                            }
                        }
                        anim.run(this.animUtil);
                    }

                    this.runUpdate = true;
                    this.#update();
                    break;
                }
            }
        }
    }

    #endState(currentState: S): void {
        // on end of state, kill all running anims

        for (const interpAnim of this.interpAnimations) {
            interpAnim.cancelFunction();
        }
        this.interpAnimations = [];

        // remove objects that exist for state
        this.animRunner.removeAnimObjectsByState(currentState, this.depth);

        const animRunsForState = this.stateAnimRuns.get(currentState);

        if (animRunsForState) {
            switch (animRunsForState.animRunType) {
                case AnimRunType.AnimManager:
                    // nothing at the moment
                    break;
                case AnimRunType.StateAnims:
                    (<StateAnims<S>> animRunsForState).runEvents(
                        StateEvent.End,
                        this.animUtil,
                    );
                    this.animTimer.cancelAnims();
                    break;
            }
        }
    }

    runEvents<PS>(event: AnimManagerEventEnum, animUtil: AnimUtil<PS>) {
        const events = this.events.get(event) || [];
        for (const func of events) {
            func(animUtil);
        }
    }

    #update() {
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
        const animRuns = this.stateAnimRuns.get(currentState);
        if (animRuns) {
            if (animRuns.animRunType === AnimRunType.StateAnims) {
                if (animRuns.checkJustCompletedAnims()) {
                    (<StateAnims<S>> animRuns).runEvents(
                        StateEvent.AnimsCompleted,
                        this.animUtil,
                    );
                }
            }
        }

        this.canvasManager.clearCanvas();

        const context = this.canvasManager.getContext();

        // draw anim objects
        this.animRunner.draw(context);

        if (this.runUpdate) {
            // re-call update
            globalThis.requestAnimationFrame(this.#update.bind(this));
        }
    }

    waitTime(timeToWait: number): Promise<void> {
        return this.animTimer.waitTime(timeToWait);
    }

    setState(newState: S) {
        if (this.canvasStateManager.currentState !== newState) {
            this.#endState(this.canvasStateManager.currentState);
            this.#startState(newState);
            this.canvasStateManager.setState(newState);
        }
    }

    endManager() {
        const currentState = this.canvasStateManager.currentState;
        this.#endState(currentState);
        this.runEvents(AnimManagerEvent.ManagerEnd, this.animUtil);
    }

    setZoomPoint(zoomAmount: number, x: number, y: number) {
        this.animRunner.setZoomPoint(zoomAmount, x, y);
    }
}
