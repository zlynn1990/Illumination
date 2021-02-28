import { CanvasWidth, CanvasHeight } from "../Constants";
import { Surface } from "./Surface";

export function createBorderSurfaces(): Surface[] {
    const surfaces: Surface[] = [];

    // Ceiling [0]
    surfaces.push({
        id: 0,
        normal: {x: 0, y: 1 },
        segment: {
            p1: { x: 0, y: 0 },
            p2: { x: CanvasWidth, y: 0 }
        }
    });

    // Right - Top [1]
    surfaces.push({
        id: 1,
        normal: {x: -1, y: 0 },
        segment: {
            p1: { x: CanvasWidth, y: 0 },
            p2: { x: CanvasWidth, y: 300 }
        }
    });

    // Block 1 - Top [2]
    surfaces.push({
        id: 2,
        normal: {x: 0, y: -1 },
        segment: {
            p1: { x: 300, y: 300 },
            p2: { x: CanvasWidth, y: 300 }
        }
    });

    // Block 1 - Left [3]
    surfaces.push({
        id: 3,
        normal: {x: -1, y: 0 },
        segment: {
            p1: { x: 300, y: 300 },
            p2: { x: 300, y: 335 }
        }
    });

    // Block 1 - Bottom [4]
    surfaces.push({
        id: 4,
        normal: {x: 0, y: 1 },
        segment: {
            p1: { x: 300, y: 335 },
            p2: { x: CanvasWidth, y: 335 }
        }
    });

    // Right - Bottom [5]
    surfaces.push({
        id: 5,
        normal: {x: -1, y: 0 },
        segment: {
            p1: { x: CanvasWidth, y: 335 },
            p2: { x: CanvasWidth, y: CanvasHeight }
        }
    });

    // Floor - Right [6]
    surfaces.push({
        id: 6,
        normal: {x: 0, y: -1 },
        segment: {
            p1: { x: 134, y: CanvasHeight },
            p2: { x: CanvasWidth, y: CanvasHeight }
        }
    });

    // Block 2 - Right [7]
    surfaces.push({
        id: 7,
        normal: {x: 1, y: 0 },
        segment: {
            p1: { x: 134, y: 480 },
            p2: { x: 134, y: CanvasHeight }
        }
    });

    // Block 2 - Top [8]
    surfaces.push({
        id: 8,
        normal: {x: 0, y: -1 },
        segment: {
            p1: { x: 100, y: 480 },
            p2: { x: 134, y: 480 }
        }
    });

    // Block 2 - Left [9]
    surfaces.push({
        id: 9,
        normal: {x: -1, y: 0 },
        segment: {
            p1: { x: 100, y: 480 },
            p2: { x: 100, y: CanvasHeight }
        }
    });

    // Floor - Left [10]
    surfaces.push({
        id: 10,
        normal: {x: 0, y: -1 },
        segment: {
            p1: { x: 0, y: CanvasHeight },
            p2: { x: 100, y: CanvasHeight }
        }
    });

    // Left - Bottom [11]
    surfaces.push({
        id: 11,
        normal: {x: 1, y: 0 },
        segment: {
            p1: { x: 0, y: 335 },
            p2: { x: 0, y: CanvasHeight }
        }
    });

    // Block 3 - Bottom [12]
    surfaces.push({
        id: 12,
        normal: {x: 0, y: 1 },
        segment: {
            p1: { x: 0, y: 335 },
            p2: { x: 153, y: 335 }
        }
    });

    // Block 3 - Right [13]
    surfaces.push({
        id: 13,
        normal: {x: 1, y: 0 },
        segment: {
            p1: { x: 153, y: 300 },
            p2: { x: 153, y: 335 }
        }
    });

    // Block 3 - Top [14]
    surfaces.push({
        id: 14,
        normal: {x: 0, y: -1 },
        segment: {
            p1: { x: 0, y: 300 },
            p2: { x: 153, y: 300 }
        }
    });

    // Left - Top [15]
    surfaces.push({
        id: 15,
        normal: {x: 1, y: 0 },
        segment: {
            p1: { x: 0, y: 0 },
            p2: { x: 0, y: 300 }
        }
    });

    return surfaces;
}

