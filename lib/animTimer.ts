import { AnimCancelled } from "./animUtil.ts";

type WaitInfo = {
    startTime: number;
    waitTime: number;
    resolveFunction: () => void;
    rejectFunction: () => void;
};

/** Timer for animations */
export default class AnimTimer {
    private currentTime: number;
    private lastTime: number | null;

    private waits: Array<WaitInfo>;

    constructor() {
        this.currentTime = 0;
        this.lastTime = null;
        this.waits = [];
    }

    /** Start the timer */
    public start() {
        this.lastTime = performance.now();
        this.currentTime = 0;
    }

    /** Get what the current time is, milliseconds since anim timer was started */
    public getCurrentTime(): number {
        return this.currentTime;
    }

    /** Updates the timer and returns the delta since the last timer */
    public updateAndGetDeltaTime(): number {
        const newTime = performance.now();

        if (this.lastTime === null) {
            this.lastTime = newTime;
        }
        const deltaTime = newTime - this.lastTime;

        this.lastTime = newTime;
        this.currentTime += deltaTime;

        for (let index = this.waits.length - 1; index >= 0; index--) {
            const waitInfo = this.waits[index];
            if (this.currentTime >= (waitInfo.startTime + waitInfo.waitTime)) {
                waitInfo.resolveFunction();
                this.waits.splice(index, 1);
            }
        }

        return deltaTime;
    }

    /**
     * Function for asynchronously waiting an amount of time before continuing
     * @param timeToWait Time to wait in milliseconds
     * @returns A promise that completes when the time is finished
     */
    public waitTime(timeToWait: number): Promise<void> {
        const startTime = this.currentTime;
        return new Promise((resolve, reject) => {
            this.waits.push({
                startTime,
                waitTime: timeToWait,
                resolveFunction: resolve,
                rejectFunction: () => {
                    reject(new AnimCancelled());
                },
            });
        });
    }

    /** Cancels all the animations within the timer */
    public cancelAnims() {
        for (const waitInfo of this.waits) {
            waitInfo.rejectFunction();
        }
        this.waits = [];
    }
}
