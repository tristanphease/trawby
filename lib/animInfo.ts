export interface AnimInfo {
    start: (animObject: AnimWorldObject) => void;
}

export interface AnimWorldObject {
    setBackground(color: string): void;
    setSize(width: number, height: number): void;
}
