import type AnimInterpInfo from "./animInterp.ts";
import type { AnimModeEnum } from "./animMode.ts";
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
import type StateManager from "./stateManager.ts";
import { StateEvent } from "./stateBuilder.ts";
import { Tree } from "@trawby/html-tree";

export interface IAnimManager {
    /** Sets the speed of the animation */
    setSpeed(speed: number): void;

    /** Toggles whether the anim timer is paused, returns whether it's paused */
    togglePause(): boolean;

    /** Starts the animation */
    start(): void;

    /** Get the anim mode of the manager */
    getAnimMode(): AnimModeEnum;
}

export default class AnimManager implements IAnimManager {
    animRunner: AnimRunner;
    canvasManager: CanvasManager;
    canvasStateManager: StateManager;
    stateAnimRuns: Map<string, AnimRun>;
    animTimer: AnimTimer;
    events: Map<
        AnimManagerEventEnum,
        Array<
            (animUtil: AnimUtil, animManager: AnimManager) => void
        >
    >;
    depth: number;
    animMode: AnimModeEnum;

    animRunType: typeof AnimRunType.AnimManager = AnimRunType.AnimManager;

    // not passed in
    animUtil: AnimUtil;
    interpAnimations: Array<AnimInterpInfo>;

    runUpdate: boolean;

    parentAnimManager: AnimManager | null;

    constructor(
        animRunner: AnimRunner,
        canvasManager: CanvasManager,
        canvasStateManager: StateManager,
        stateAnimRuns: Map<string, AnimRun>,
        animTimer: AnimTimer,
        events: Map<
            AnimManagerEventEnum,
            Array<
                (
                    animUtil: AnimUtil,
                    animManager: AnimManager,
                ) => void
            >
        >,
        depth: number,
        animMode: AnimModeEnum,
    ) {
        this.animRunner = animRunner;
        this.canvasManager = canvasManager;
        this.canvasStateManager = canvasStateManager;
        this.stateAnimRuns = stateAnimRuns;
        this.animTimer = animTimer;
        this.events = events;
        this.depth = depth;
        this.animMode = animMode;

        this.animUtil = new AnimUtil(this);
        this.interpAnimations = [];
        this.runUpdate = false;
        this.parentAnimManager = null;
    }

    getAnimMode(): AnimModeEnum {
        return this.animMode;
    }

    /** Sets the speed of the animation */
    setSpeed(speed: number): void {
        this.animTimer.speed = speed;
    }

    /** Toggles whether the anim timer is paused, returns whether it's paused */
    togglePause(): boolean {
        return this.animTimer.togglePause();
    }

    /** Starts the anim manager */
    start(): void {
        const startState = this.canvasStateManager.currentState;

        this.runEvents(AnimManagerEvent.ManagerStart, this.animUtil);

        if (startState) {
            this.#startState(startState);
        }
    }

    /** Adds an interp to the manager */
    addInterp(animInterpInfo: AnimInterpInfo) {
        this.interpAnimations.push(animInterpInfo);
    }

    #startState(newState: string): void {
        const animRunsForState = this.stateAnimRuns.get(newState);

        if (animRunsForState) {
            switch (animRunsForState.animRunType) {
                case AnimRunType.AnimManager:
                    this.runUpdate = false;
                    animRunsForState.start();
                    break;
                case AnimRunType.StateAnims: {
                    animRunsForState.runEvents(
                        StateEvent.Start,
                        this.animUtil,
                    );

                    for (
                        const anim of animRunsForState.anims
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

    #endState(currentState: string): void {
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
                    animRunsForState.runEvents(
                        StateEvent.End,
                        this.animUtil,
                    );
                    this.animTimer.cancelAnims();
                    break;
            }
        }
    }

    runEvents(event: AnimManagerEventEnum, animUtil: AnimUtil) {
        const events = this.events.get(event) || [];
        for (const func of events) {
            func(animUtil, this);
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
        if (currentState) {
            const animRuns = this.stateAnimRuns.get(currentState);
            if (animRuns) {
                if (animRuns.animRunType === AnimRunType.StateAnims) {
                    if (animRuns.checkJustCompletedAnims()) {
                        animRuns.runEvents(
                            StateEvent.AnimsCompleted,
                            this.animUtil,
                        );
                    }
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

    setState(newState: string) {
        const currentState = this.canvasStateManager.currentState;
        if (currentState !== newState) {
            if (currentState !== null) {
                this.#endState(currentState);
            }
            this.#startState(newState);
            this.canvasStateManager.setState(newState);
        }
    }

    nextState() {
        const nextState = this.canvasStateManager.getNextState();
        if (nextState !== null) {
            this.setState(nextState);
        } else {
            this.#endManager();
        }
    }

    #endManager() {
        const currentState = this.canvasStateManager.currentState;
        if (currentState !== null) {
            this.#endState(currentState);
        }
        this.runEvents(AnimManagerEvent.ManagerEnd, this.animUtil);
        this.runUpdate = false;
    }

    setZoomPoint(zoomAmount: number, x: number, y: number) {
        this.animRunner.setZoomPoint(zoomAmount, x, y);
    }

    /** Exports the anim manager as a tree for custom usage */
    exposeAsTree(): Tree<AnimRun> {
        const childrenTree: Array<Tree<AnimRun>> = Array.from(
            this.stateAnimRuns.values().map((a) => a.exposeAsTree()),
        );
        return Tree.create(<AnimRun> this, childrenTree);
    }
}
