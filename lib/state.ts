/** Manager for the state of the canvas */
export default class CanvasStateManager<S> {
    currentState: S;

    constructor(startState: S) {
        this.currentState = startState;
    }

    /** Sets the state of the animation to the one provided */
    public setState(newState: S) {
        this.currentState = newState;
    }
}
