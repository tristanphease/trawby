class AnimTimer {
    private currentTime: number;
    private lastTime: number | null;

    constructor() {
        this.currentTime = 0;
        this.lastTime = null;
    }

    public start() {
        this.lastTime = performance.now();
        this.currentTime = 0;
    }

    public getCurrentTime(): number {
        return this.currentTime;
    }

    public updateAndGetDeltaTime() {
        const newTime = performance.now();

        if (this.lastTime === null) {
            this.lastTime = newTime;
        }
        const deltaTime = newTime - this.lastTime;

        this.lastTime = newTime;
        this.currentTime += deltaTime;

        return deltaTime;
    }
}

export default AnimTimer;
