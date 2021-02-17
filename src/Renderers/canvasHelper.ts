import { CanvasHeight, CanvasWidth } from "../Constants";

export function fill(context: CanvasRenderingContext2D, color: string) {
    context.globalAlpha = 1.0;
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = color;
    context.fillRect(0, 0, CanvasWidth, CanvasHeight);
}

export function startBlur(context: CanvasRenderingContext2D, radius: number) {
    context.filter = `blur(${radius}px)`;
}

export function endBlur(context: CanvasRenderingContext2D) {
    context.filter = 'none';
}

export function overlayImage(context: CanvasRenderingContext2D, image: HTMLImageElement) {
    context.globalCompositeOperation = 'overlay';
    context.drawImage(image, 0, 0);
    context.globalCompositeOperation = 'source-over';
}