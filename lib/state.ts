
class CanvasStateManager<T> {
    currentState: T;

    constructor(startState: T) {
        this.currentState = startState;
    }


}

export default CanvasStateManager;