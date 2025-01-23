export interface AnimInfo {
  start: (animObject: AnimObject) => void;
}

export interface AnimObject {
  setBackground(color: string): void;
  setSize(width: number, height: number): void;
}
