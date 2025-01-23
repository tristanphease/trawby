
export default class CanvasManager {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d")!;
    }

    public setDimensions(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    public getContext(): CanvasRenderingContext2D {
        return this.ctx;
    }
}
