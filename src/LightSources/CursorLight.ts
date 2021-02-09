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
            segment: { l1X: this.sourceX, l1Y: this.sourceY, l2X: this.sourceX + 40, l2Y: this.sourceY + 40 },
            a0: 2.3,
            a1: 1.1,
            intensity: 1.0,
            emissionSegmentId: -1
          }];
    }
}