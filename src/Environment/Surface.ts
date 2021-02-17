import { LineSegment } from "../Primitives/LineSegment";

export interface Surface {
    id: number;
    
    segment: LineSegment;
    
    visibleSurfaceIds: number[];
}