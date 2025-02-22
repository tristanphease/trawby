import { getRandomInt } from "./random.ts";

/** A utility color class for usage in this library */
export default class Color {
    red: number;
    green: number;
    blue: number;

    constructor(r: number, g: number, b: number) {
        this.red = r;
        this.green = g;
        this.blue = b;
    }

    /** Generate hex string for use in other color related sections */
    public toHexString(): string {
        const red = hexStringFromNumber(this.red);
        const green = hexStringFromNumber(this.green);
        const blue = hexStringFromNumber(this.blue);
        return `#${red}${green}${blue}`;
    }

    static BLACK: Color = new Color(0, 0, 0);
    static WHITE: Color = new Color(255, 255, 255);
}

function hexStringFromNumber(colorValue: number) {
    let colorString = colorValue.toString(16);
    if (colorString.length === 1) {
        colorString = `0${colorString}`;
    }
    return colorString;
}

export function getRandomColor(): Color {
    const red = getRandomInt(0, 256);
    const green = getRandomInt(0, 256);
    const blue = getRandomInt(0, 256);
    return new Color(red, green, blue);
}

/** Creates a color from a hex string. Returns null if hex color is invalid */
export function colorFromHex(hexCode: string): Color | null {
    const regex = new RegExp(/#((?:[0-9]|[a-f]){1,2}){3,4}$/);

    if (!regex.test(hexCode)) {
        return null;
    }

    const charsPerValue = hexCode.length <= 5 ? 1 : 2;

    const redValue = getFromString(hexCode, 1, charsPerValue);
    const greenValue = getFromString(hexCode, 1 + charsPerValue, charsPerValue);
    const blueValue = getFromString(
        hexCode,
        1 + 2 * charsPerValue,
        charsPerValue,
    );
    // could get optional alpha here

    const color = new Color(redValue, greenValue, blueValue);

    return color;

    function getFromString(
        value: string,
        startIndex: number,
        charsPerIndex: number,
    ): number {
        let stringVal = value.substring(
            startIndex,
            startIndex + charsPerIndex,
        );
        if (charsPerIndex == 1) {
            stringVal = stringVal + stringVal;
        }
        return parseInt(stringVal, 16);
    }
}
