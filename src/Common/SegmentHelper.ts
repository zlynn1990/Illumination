import { Epsilon } from "../Constants";
import { Point } from "../Primitives/Point";
import { LineSegment } from "../Primitives/LineSegment";


export class SegmentHelper {
    static Center(segment: LineSegment): Point {
        return {
            x: segment.p1.x + (segment.p2.x - segment.p1.x) * 0.5,
            y: segment.p1.y + (segment.p2.y - segment.p1.y) * 0.5
        };
    }

    // Test to see if the two segments are connected
    static TestConnection(s1: LineSegment, s2: LineSegment): Point | undefined {
        if (Math.abs(s1.p1.x - s2.p1.x) < Epsilon && Math.abs(s1.p1.y - s2.p1.y) < Epsilon) {
            return s2.p1;
        } else if (Math.abs(s1.p1.x - s2.p2.x) < Epsilon && Math.abs(s1.p1.y - s2.p2.y) < Epsilon) {
            return s2.p2;
        } else if (Math.abs(s1.p2.x - s2.p1.x) < Epsilon && Math.abs(s1.p2.y - s2.p1.y) < Epsilon) {
            return s2.p1;
        } else if (Math.abs(s1.p2.x - s2.p2.x) < Epsilon && Math.abs(s1.p2.y - s2.p2.y) < Epsilon) {
            return s2.p2;
        } else {
            return undefined;
        }
    }
}