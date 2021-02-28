import { Point } from "../Primitives/Point";

export interface IntensityPoint {
    location: Point;

    value: number;
}
export interface LitPolygon {
    maxIntensity: IntensityPoint;
    minIntensity: IntensityPoint;

    points: Point[];
}