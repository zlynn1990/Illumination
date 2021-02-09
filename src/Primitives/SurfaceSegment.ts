export interface SurfaceSegment {
    l1X: number;
    l1Y: number;

    l2X: number;
    l2Y: number;

    previousSegmentId: number;
    nextSegmentId: number;
    
    hitableSegmentIds: number[];
}