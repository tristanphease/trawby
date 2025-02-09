type WaitInfo = {
    startTime: number;
    waitTime: number;
    resolveFunction: () => void;
};

class AnimTimer {
    private currentTime: number;
    private lastTime: number | null;

    private waits: Array<WaitInfo>;

    constructor() {
        this.currentTime = 0;
        this.lastTime = null;
        this.waits = [];
    }

    public start() {
        this.lastTime = performance.now();
        this.currentTime = 0;
    }

    public getCurrentTime(): number {
        return this.currentTime;
    }

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

    public waitTime(timeToWait: number): Promise<void> {
        const startTime = this.currentTime;
        return new Promise((resolve) => {
            this.waits.push({
                startTime,
                waitTime: timeToWait,
                resolveFunction: resolve,
            });
        });
    }
}

export default AnimTimer;
