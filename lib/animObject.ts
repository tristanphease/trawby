/** An object to be animated */
export default interface AnimObject {
    /** If object needs to be instantiated with a canvas context, run this start */
    start?: (ctx: CanvasRenderingContext2D) => void;
    /** Draw the anim object using the canvas context */
    draw(ctx: CanvasRenderingContext2D): void;
}
