import type AnimObject from "../animObject.ts";
import type { Point } from "../util/point.ts";

/** A single line */
export default class Line implements AnimObject {
    point1: Point;
    point2: Point;

    /** Create a line from two points */
    constructor(point1: Point, point2: Point) {
        this.point1 = point1;
        this.point2 = point2;
    }

    /** Draw the line */
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        ctx.moveTo(this.point1.x, this.point1.y);
        ctx.lineTo(this.point2.x, this.point2.y);
        ctx.stroke();
    }
}
