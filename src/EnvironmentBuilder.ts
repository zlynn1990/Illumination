import { CanvasWidth, CanvasHeight } from "./Constants";
import { SurfaceSegment } from "./Primitives/SurfaceSegment";

export function CreateBorderSurfaces(): SurfaceSegment[] {
    const segments: SurfaceSegment[] = [];

    // Ceiling [0]
    segments.push({
        l1X: 0,
        l1Y: 0,
        l2X: CanvasWidth,
        l2Y: 0,
        previousSegmentId: 15,
        nextSegmentId: 1,
        hitableSegmentIds: [2, 1, 6, 7, 8, 10, 13, 14, 15]
    });

    // Right - Top [1]
    segments.push({
        l1X: CanvasWidth,
        l1Y: 0,
        l2X: CanvasWidth,
        l2Y: 300,
        previousSegmentId: 0,
        nextSegmentId: 1,
        hitableSegmentIds: [2, 0]
    });

    // Block 1 - Top [2]
    segments.push({
        l1X: 300,
        l1Y: 300,
        l2X: CanvasWidth,
        l2Y: 300,
        previousSegmentId: 0,
        nextSegmentId: 1,
        hitableSegmentIds: [0, 1]
    });

    // Block 1 - Left [3]
    segments.push({
        l1X: 300,
        l1Y: 300,
        l2X: 300,
        l2Y: 335,
        previousSegmentId: 0,
        nextSegmentId: 1,
        hitableSegmentIds: [7, 8]
    });

    // Block 1 - Bottom [4]
    segments.push({
        l1X: 300,
        l1Y: 335,
        l2X: CanvasWidth,
        l2Y: 335,
        previousSegmentId: 0,
        nextSegmentId: 1,
        hitableSegmentIds: [5, 6]
    });

    // Right - Bottom [5]
    segments.push({
        l1X: CanvasWidth,
        l1Y: 335,
        l2X: CanvasWidth,
        l2Y: CanvasHeight,
        previousSegmentId: 0,
        nextSegmentId: 1,
        hitableSegmentIds: [4, 6]
    });

    // Floor - Right [6]
    segments.push({
        l1X: 134,
        l1Y: CanvasHeight,
        l2X: CanvasWidth,
        l2Y: CanvasHeight,
        previousSegmentId: 0,
        nextSegmentId: 1,
        hitableSegmentIds: [4, 3, 5, 7, 12, 13, 15, 0]
    });

    // Block 2 - Right [7]
    segments.push({
        l1X: 134,
        l1Y: 480,
        l2X: 134,
        l2Y: CanvasHeight,
        previousSegmentId: 0,
        nextSegmentId: 1,
        hitableSegmentIds: [0, 3, 4, 6]
    });

    // Block 2 - Top [8]
    segments.push({
        l1X: 100,
        l1Y: 480,
        l2X: 134,
        l2Y: 480,
        previousSegmentId: 0,
        nextSegmentId: 1,
        hitableSegmentIds: [11, 12]
    });
    
    // Block 2 - Left [9]
    segments.push({
        l1X: 100,
        l1Y: 480,
        l2X: 100,
        l2Y: CanvasHeight,
        previousSegmentId: 0,
        nextSegmentId: 1,
        hitableSegmentIds: [10, 11, 12]
    });

    // Floor - Left [10]
    segments.push({
        l1X: 0,
        l1Y: CanvasHeight,
        l2X: 100,
        l2Y: CanvasHeight,
        previousSegmentId: 0,
        nextSegmentId: 1,
        hitableSegmentIds: [9, 11, 12]
    });

    // Left - Bottom [11]
    segments.push({
        l1X: 0,
        l1Y: 335,
        l2X: 0,
        l2Y: CanvasHeight,
        previousSegmentId: 0,
        nextSegmentId: 1,
        hitableSegmentIds: [10, 12, 0]
    });

    // Block 3 - Bottom [12]
    segments.push({
        l1X: 0,
        l1Y: 335,
        l2X: 153,
        l2Y: 335,
        previousSegmentId: 0,
        nextSegmentId: 1,
        hitableSegmentIds: [8, 9, 10, 11]
    });

    // Block 3 - Right [13]
    segments.push({
        l1X: 153,
        l1Y: 300,
        l2X: 153,
        l2Y: 335,
        previousSegmentId: 0,
        nextSegmentId: 1,
        hitableSegmentIds: [0, 6]
    });

    // Block 3 - Top [14]
    segments.push({
        l1X: 0,
        l1Y: 300,
        l2X: 153,
        l2Y: 300,
        previousSegmentId: 15,
        nextSegmentId: 13,
        hitableSegmentIds: [0, 15]
    });

    // Left - Top [15]
    segments.push({
        l1X: 0,
        l1Y: 0,
        l2X: 0,
        l2Y: 300,
        previousSegmentId: 0,
        nextSegmentId: 1,
        hitableSegmentIds: [0, 14, 3, 6]
    });

    return segments;
}

