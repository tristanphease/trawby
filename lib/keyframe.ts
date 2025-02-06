export interface AnimKeyframe {
    // value between 0 and 1 indicating the amount through the keyframe is
    distanceThrough: number;

    value: number;
}

/**
 * Helper function to create keyframes simply
 * @param values values that will be evenly spread out
 * @returns array of keyframes to be used for interp in animation
 */
export function createKeyframes(...values: Array<number>): Array<AnimKeyframe> {
    const keyframes: Array<AnimKeyframe> = values.map((value, index) => ({
        distanceThrough: index / (values.length - 1),
        value,
    }));

    return keyframes;
}
