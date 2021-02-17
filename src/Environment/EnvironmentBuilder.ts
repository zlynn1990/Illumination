import { CanvasWidth, CanvasHeight } from "../Constants";
import { Surface } from "./Surface";

export function createBorderSurfaces(): Surface[] {
    const surfaces: Surface[] = [];

    // Ceiling [0]
    surfaces.push({
        id: 0,
        segment: {
            l1X: 0,
            l1Y: 0,
            l2X: CanvasWidth,
            l2Y: 0
        },
        visibleSurfaceIds: [1, 2, 3, 5, 6, 7, 8, 10, 11, 13, 14, 15]
    });

    // Right - Top [1]
    surfaces.push({
        id: 1,
        segment: {
            l1X: CanvasWidth,
            l1Y: 0,
            l2X: CanvasWidth,
            l2Y: 300,
        },
        visibleSurfaceIds: [0, 2, 7, 8, 10, 11, 13, 14, 15]
    });

    // Block 1 - Top [2]
    surfaces.push({
        id: 2,
        segment: {
            l1X: 300,
            l1Y: 300,
            l2X: CanvasWidth,
            l2Y: 300
        },
        visibleSurfaceIds: [0, 1, 15]
    });

    // Block 1 - Left [3]
    surfaces.push({
        id: 3,
        segment: {
            l1X: 300,
            l1Y: 300,
            l2X: 300,
            l2Y: 335
        },
        visibleSurfaceIds: [0, 6, 7, 8, 10, 11, 13, 15]
    });

    // Block 1 - Bottom [4]
    surfaces.push({
        id: 4,
        segment: {
            l1X: 300,
            l1Y: 335,
            l2X: CanvasWidth,
            l2Y: 335,
        },
        visibleSurfaceIds: [5, 6, 7, 8, 10, 11]
    });

    // Right - Bottom [5]
    surfaces.push({
        id: 5,
        segment: {
            l1X: CanvasWidth,
            l1Y: 335,
            l2X: CanvasWidth,
            l2Y: CanvasHeight
        },
        visibleSurfaceIds: [4, 6, 7, 8, 11, 12, 13, 15]
    });

    // Floor - Right [6]
    surfaces.push({
        id: 6,
        segment: {
            l1X: 134,
            l1Y: CanvasHeight,
            l2X: CanvasWidth,
            l2Y: CanvasHeight,
        },
        visibleSurfaceIds: [0, 3, 4, 5, 7, 12, 13, 15]
    });

    // Block 2 - Right [7]
    surfaces.push({
        id: 7,
        segment: {
            l1X: 134,
            l1Y: 480,
            l2X: 134,
            l2Y: CanvasHeight,
        },
        visibleSurfaceIds: [0, 1, 3, 4, 5, 6]
    });

    // Block 2 - Top [8]
    surfaces.push({
        id: 8,
        segment: {
            l1X: 100,
            l1Y: 480,
            l2X: 134,
            l2Y: 480
        },
        visibleSurfaceIds: [0, 1, 3, 4, 5, 11, 12]
    });

    // Block 2 - Left [9]
    surfaces.push({
        id: 9,
        segment: {
            l1X: 100,
            l1Y: 480,
            l2X: 100,
            l2Y: CanvasHeight
        },
        visibleSurfaceIds: [10, 11, 12]
    });

    // Floor - Left [10]
    surfaces.push({
        id: 10,
        segment: {
            l1X: 0,
            l1Y: CanvasHeight,
            l2X: 100,
            l2Y: CanvasHeight
        },
        visibleSurfaceIds: [0, 1, 3, 9, 11, 12]
    });

    // Left - Bottom [11]
    surfaces.push({
        id: 11,
        segment: {
            l1X: 0,
            l1Y: 335,
            l2X: 0,
            l2Y: CanvasHeight
        },
        visibleSurfaceIds: [0, 1, 3, 4, 5, 6, 9, 10, 12]
    });

    // Block 3 - Bottom [12]
    surfaces.push({
        id: 12,
        segment: {
            l1X: 0,
            l1Y: 335,
            l2X: 153,
            l2Y: 335
        },
        visibleSurfaceIds: [5, 6, 8, 9, 10, 11]
    });

    // Block 3 - Right [13]
    surfaces.push({
        id: 13,
        segment: {
            l1X: 153,
            l1Y: 300,
            l2X: 153,
            l2Y: 335
        },
        visibleSurfaceIds: [0, 1, 3, 5, 6]
    });

    // Block 3 - Top [14]
    surfaces.push({
        id: 14,
        segment: {
            l1X: 0,
            l1Y: 300,
            l2X: 153,
            l2Y: 300
        },
        visibleSurfaceIds: [0, 1, 15]
    });

    // Left - Top [15]
    surfaces.push({
        id: 15,
        segment: {
            l1X: 0,
            l1Y: 0,
            l2X: 0,
            l2Y: 300
        },
        visibleSurfaceIds: [0, 1, 2, 3, 5, 6, 14]
    });

    return surfaces;
}

