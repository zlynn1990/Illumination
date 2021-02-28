import { Point } from "./Point";

export interface Ray {
    origin: Point;
    angle: number;
}

export interface LitRay extends Ray {
    intensity: number;
    emissionSurfaceId: number;
}