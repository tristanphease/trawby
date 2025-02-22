import type AnimObject from "../animObject.ts";
import Color from "../util/color.ts";

type PixelGridOptions = {
    defaultColor: Color;
};

/**
 * Optimised pixel grid, uses [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) underneath.
 */
export default class PixelGrid implements AnimObject {
    private imageData: ImageData | null;

    x: number;
    y: number;
    width: number;
    height: number;

    defaultColor: Color | null;

    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        options?: PixelGridOptions,
    ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.imageData = null;
        if (options) {
            this.defaultColor = options.defaultColor;
        } else {
            this.defaultColor = Color.WHITE;
        }
    }

    /** Start the pixel grid, used internally */
    start(context: CanvasRenderingContext2D) {
        this.imageData = context.createImageData(this.width, this.height);
        if (this.defaultColor !== null) {
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    this.setPixel(x, y, this.defaultColor);
                }
            }
        }
    }

    private getIndex(x: number, y: number): number {
        return y * this.width * 4 + x * 4;
    }

    /** Gets the color set at the pixel (x, y) */
    public getPixel(x: number, y: number): Color {
        const index = this.getIndex(x, y);
        const red = this.imageData!.data[index];
        const green = this.imageData!.data[index + 1];
        const blue = this.imageData!.data[index + 2];
        return new Color(red, green, blue);
    }

    /** Sets the pixel at (x, y) to the color passed in */
    public setPixel(x: number, y: number, color: Color) {
        const index = this.getIndex(x, y);
        this.imageData!.data[index] = color.red;
        this.imageData!.data[index + 1] = color.green;
        this.imageData!.data[index + 2] = color.blue;
        this.imageData!.data[index + 3] = 255;
    }

    /** Clears the pixel grid, sets it all to one color */
    public clearAll(color: Color) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.setPixel(x, y, color);
            }
        }
    }

    /** Draws the pixel grid on the canvas */
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.putImageData(this.imageData!, this.x, this.y);
    }
}
