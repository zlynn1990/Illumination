import { Point } from "./Point";

export interface Ray {
    origin: Point;
    angle: number;

    intensity: number;
    emissionSurfaceId: number;
}