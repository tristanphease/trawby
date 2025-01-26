import type AnimRunner from "./animRunner.ts";
import type CanvasManager from "./canvas.ts";
import type CanvasStateManager from "./state.ts";

class AnimManager<T> {
    animRunner: AnimRunner;
    canvasManager: CanvasManager;
    canvasStateManager: CanvasStateManager<T>;

    constructor(
        animRunner: AnimRunner,
        canvasManager: CanvasManager,
        canvasStateManager: CanvasStateManager<T>,
    ) {
        this.animRunner = animRunner;
        this.canvasManager = canvasManager;
        this.canvasStateManager = canvasStateManager;
    }

    start() {
        const context = this.canvasManager.getContext();
        this.animRunner.draw(context);
    }
}
export default AnimManager;
