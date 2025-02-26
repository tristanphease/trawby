import type AnimObject from "./animObject.ts";
import { addToMapArray } from "./util/mapUtil.ts";

/** An object that runs the anims on the objects */
export default class AnimRunner {
    private animObjects: Set<AnimObject>;
    private animObjectsByState: Map<unknown, Array<AnimObject>>;

    private zoomPoint: { x: number; y: number } | null;
    private zoomAmount: number;

    constructor() {
        this.animObjects = new Set();
        this.animObjectsByState = new Map();

        this.zoomPoint = null;
        this.zoomAmount = 1;
    }

    /** Add anim object to runner, returns whether was added or already exists */
    addAnimObject<S>(animObject: AnimObject, stateAdded: S): boolean {
        if (!this.animObjects.has(animObject)) {
            this.animObjects.add(animObject);
            addToMapArray(this.animObjectsByState, stateAdded, animObject);
            return true;
        }
        return false;
    }

    removeAnimObjectsByState<S>(state: S) {
        const animObjects = this.animObjectsByState.get(state);

        if (animObjects) {
            for (const animObject of animObjects) {
                this.animObjects.delete(animObject);
            }

            this.animObjectsByState.delete(state);
        }
    }

    /** Main draw loop for anim objects */
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
