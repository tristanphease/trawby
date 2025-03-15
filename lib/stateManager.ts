/** Manager for the state of the canvas */
export default class StateManager {
    currentState: string | null;

    states: Array<string>;

    /** Create a new state manager */
    constructor(states: Array<string>) {
        this.currentState = states.length === 0 ? null : states[0];
        this.states = states;
    }

    /** Sets the state of the animation to the one provided */
    setState(newState: string) {
        this.currentState = newState;
    }

    getNextState(): string | null {
        if (this.currentState === null) return null;
        const index = this.states.indexOf(this.currentState);
        // if index isn't last one in array
        if (index < this.states.length - 1) {
            return this.states[index + 1];
        }
        return null;
    }
}
