import { Epsilon } from "../Constants";
import { Point } from "../Primitives/Point";

export class PointHelper {
    static Equal(p1: Point, p2: Point): boolean {
        return Math.abs(p1.x - p2.x) < Epsilon && Math.abs(p1.y - p2.y) < Epsilon;
    }
}