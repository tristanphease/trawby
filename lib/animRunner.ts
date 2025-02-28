import type AnimObject from "./animObject.ts";
import { addToMapArray, getMapOfMap } from "./util/mapUtil.ts";

/** An object that runs the anims on the objects */
export default class AnimRunner {
    #animObjects: Set<AnimObject>;
    // map by depth first, then by state
    #animObjectsByStateAndDepth: Map<
        number,
        Map<unknown, Array<AnimObject>>
    >;

    #zoomPoint: { x: number; y: number } | null;
    #zoomAmount: number;

    constructor() {
        this.#animObjects = new Set();
        this.#animObjectsByStateAndDepth = new Map();

        this.#zoomPoint = null;
        this.#zoomAmount = 1;
    }

    /** Add anim object to runner, returns whether was added or already exists */
    addAnimObject<S>(
        animObject: AnimObject,
        stateAdded: S,
        depth: number,
    ): boolean {
        if (!this.#animObjects.has(animObject)) {
            this.#animObjects.add(animObject);
            const animObjectsByState = getMapOfMap(
                this.#animObjectsByStateAndDepth,
                depth,
            );
            addToMapArray(
                animObjectsByState,
                stateAdded,
                animObject,
            );
            return true;
        }
        return false;
    }

    removeAnimObjectsByState<S>(state: S, depth: number) {
        const animObjectsByState = getMapOfMap(
            this.#animObjectsByStateAndDepth,
            depth,
        );
        const animObjects = animObjectsByState.get(state);

        if (animObjects) {
            for (const animObject of animObjects) {
                this.#animObjects.delete(animObject);
            }

            animObjectsByState.delete(state);
        }
    }

    /** Main draw loop for anim objects */
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();

        if (this.#zoomAmount != 1) {
            if (this.#zoomPoint != null) {
                ctx.translate(this.#zoomPoint.x, this.#zoomPoint.y);
            }
            ctx.scale(this.#zoomAmount, this.#zoomAmount);

            if (this.#zoomPoint != null) {
                ctx.translate(-this.#zoomPoint.x, -this.#zoomPoint.y);
            }
        }

        for (const animObject of this.#animObjects) {
            animObject.draw(ctx);
        }
        ctx.restore();
    }

    setZoomPoint(zoomAmount: number, x: number, y: number) {
        this.#zoomPoint = {
            x,
            y,
        };
        this.#zoomAmount = zoomAmount;
    }
}
