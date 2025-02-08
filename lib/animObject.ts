/** An object to be animated */
export default interface AnimObject {
    start?: (ctx: CanvasRenderingContext2D) => void;
    draw(ctx: CanvasRenderingContext2D): void;
}
