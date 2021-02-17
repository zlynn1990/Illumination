import { distance, Point } from "./Point";
import { Epsilon } from "../Constants";

export interface LineSegment {
    l1X: number;
    l1Y: number;

    l2X: number;
    l2Y: number;
}

// Test to see if the two segments are connected
export function testConnection(s1: LineSegment, s2: LineSegment): Point {
    if (Math.abs(s1.l1X - s2.l1X) < Epsilon && Math.abs(s1.l1Y - s2.l1Y) < Epsilon) {
        return { x: s2.l1X, y: s2.l1Y };
    } else if (Math.abs(s1.l1X - s2.l2X) < Epsilon && Math.abs(s1.l1Y - s2.l2Y) < Epsilon) {
        return { x: s2.l2X, y: s2.l2Y };
    } else if (Math.abs(s1.l2X - s2.l1X) < Epsilon && Math.abs(s1.l2Y - s2.l1Y) < Epsilon) {
        return { x: s2.l1X, y: s2.l1Y };
    } else if (Math.abs(s1.l2X - s2.l2X) < Epsilon && Math.abs(s1.l2Y - s2.l2Y) < Epsilon) {
        return { x: s2.l2X, y: s2.l2Y };
    } else {
        return { x: -1, y: -1 };
    }
}

export function closestEdge(segment: LineSegment, point: Point): Point {
    const edge1Dist = distance(segment.l1X, segment.l1Y, point.x, point.y);
    const edge2Dist = distance(segment.l2X, segment.l2Y, point.x, point.y);

    if (edge1Dist < edge2Dist) {
        return { x: segment.l1X, y: segment.l1Y };
    } else {
        return { x: segment.l2X, y: segment.l2Y };
    }
}