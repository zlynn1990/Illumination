export interface Point {
    x: number;
    y: number;
}

export function distance(x0: number, y0: number, x1: number, y1: number): number {
    return Math.sqrt(Math.pow(x1 - x0, 2) + (Math.pow(y1 - y0, 2)));
}