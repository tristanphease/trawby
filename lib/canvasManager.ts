export default class CanvasManager {
    #canvas: HTMLCanvasElement;
    #ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.#canvas = canvas;
        this.#ctx = this.#canvas.getContext("2d")!;
    }

    setDimensions(width: number, height: number) {
        this.#canvas.width = width;
        this.#canvas.height = height;
    }

    getContext(): CanvasRenderingContext2D {
        return this.#ctx;
    }

    clearCanvas(): void {
        this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    }
}
