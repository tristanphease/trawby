import type AnimObject from "../animObject.ts";

export type TextOptions = {
    font: string;
};

export default class Text implements AnimObject {
    private text: string;
    private x: number;
    private y: number;
    private font: string | null;

    constructor(text: string, x: number, y: number, options?: TextOptions) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.font = options?.font || null;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.font) {
            ctx.font = this.font;
        }
        ctx.fillText(this.text, this.x, this.y);
    }
}
