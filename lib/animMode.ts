export const AnimMode = {
    Automatic: 0,
    Interactive: 1,
} as const;
export type AnimModeEnum = typeof AnimMode[keyof typeof AnimMode];
export const DEFAULT_ANIMMODE = AnimMode.Automatic;
