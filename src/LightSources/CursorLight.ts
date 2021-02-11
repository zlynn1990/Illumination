import { CanvasHeight, CanvasWidth } from "../Constants";
import { Light } from "./Light";
import { LightSource } from "./LightSource";

export class CursorLight implements Light {
    private sourceX = CanvasWidth / 2;
    private sourceY = CanvasHeight / 4;

    Update(cursorX: number, cursorY: number): void {
        this.sourceX = cursorX;
        this.sourceY = cursorY;
    }

    generateSources(): LightSource[] {
        return [{
            segment: { l1X: this.sourceX - 10, l1Y: this.sourceY, l2X: this.sourceX, l2Y: this.sourceY + 10 },
            a0: 4,
            a1: 3,
            intensity: 0.65,
            emissionSegmentId: -1
          }];
    }
}