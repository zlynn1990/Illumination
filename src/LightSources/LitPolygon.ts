import { Point } from "../Primitives/Point";

export interface IntensityPoint {
    x: number;
    y: number;

    value: number;
}
export interface LitPolygon {
    maxIntensity: IntensityPoint;
    minIntensity: IntensityPoint;

    points: Point[];
}