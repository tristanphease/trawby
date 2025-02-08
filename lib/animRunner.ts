import type AnimObject from "./animObject.ts";

/** An object that runs the anims on the objects */
export default class AnimRunner {
    private animObjects: Array<AnimObject>;

    private zoomPoint: { x: number; y: number } | null;
    private zoomAmount: number;

    constructor() {
        this.animObjects = [];

        this.zoomPoint = null;
        this.zoomAmount = 1;
    }

    addAnim(animObject: AnimObject) {
        this.animObjects.push(animObject);
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();

        if (this.zoomAmount != 1) {
            if (this.zoomPoint != null) {
                ctx.translate(this.zoomPoint.x, this.zoomPoint.y);
            }
            ctx.scale(this.zoomAmount, this.zoomAmount);

            if (this.zoomPoint != null) {
                ctx.translate(-this.zoomPoint.x, -this.zoomPoint.y);
            }
        }

        for (const animObject of this.animObjects) {
            animObject.draw(ctx);
        }
        ctx.restore();
    }

    public setZoomPoint(zoomAmount: number, x: number, y: number) {
        this.zoomPoint = {
            x,
            y,
        };
        this.zoomAmount = zoomAmount;
    }
}
