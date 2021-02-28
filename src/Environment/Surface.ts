import { Point } from "../Primitives/Point";
import { LineSegment } from "../Primitives/LineSegment";

export interface Surface {
    id: number;
    
    normal: Point;
    segment: LineSegment;
}