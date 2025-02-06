class CanvasStateManager<S> {
    currentState: S;

    constructor(startState: S) {
        this.currentState = startState;
    }

    public setState(newState: S) {
        this.currentState = newState;
    }
}

export default CanvasStateManager;
