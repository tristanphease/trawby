import type AnimObject from "./animObject.ts";

/** An object that runs the anims on the objects */
export default class AnimRunner {
    private animObjects: Array<AnimObject>;

    constructor() {
        this.animObjects = [];
    }

    addAnim(animObject: AnimObject) {
        this.animObjects.push(animObject);
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        for (const animObject of this.animObjects) {
            animObject.draw(ctx);
        }
    }
}
