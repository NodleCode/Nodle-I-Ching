import { Point } from "../Point";

/**
 * @class Writer
 */
export class Writer {
    private static UNIT_DIM: number = 14;
    private static BITS_PER_SYMBOL: number = 6;
    private static SYMBOL_DIM: number = (Writer.BITS_PER_SYMBOL * 2 - 1) * Writer.UNIT_DIM;
    private static GAP_DIM: number = Writer.UNIT_DIM * 3;
    private static GRID_OFFSET: number = Writer.SYMBOL_DIM * 2;
    private static FINDER_RADIUS: number = Writer.SYMBOL_DIM * 0.5;

    private image: HTMLImageElement;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    /**
     * Creates an instance of Writer.
     * @constructor
     * @param {(HTMLImageElement | string)} img - The HTML img tag used for output.
     */
    public constructor(img: HTMLImageElement | string) {
        if (typeof img === "string") {
            this.image = document.getElementById(img) as HTMLImageElement;
        } else {
            this.image = img;
        }
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
    }

    /**
     * Creates an IChing symbol image in the provided img tag.
     * @param {number[]} data - Raw symbol data.
     * @param {number} rows - Number of rows of the symbol.
     * @param {number} cols - Number of columns of the symbol.
     */
    public createImage(data: number[], rows: number, cols: number) {
        const imgHeight = (rows + 4) * Writer.SYMBOL_DIM + (rows - 1) * Writer.GAP_DIM;
        const imgWidth = (cols + 4) * Writer.SYMBOL_DIM + (cols - 1) * Writer.GAP_DIM;
        this.canvas.height = imgHeight;
        this.canvas.width = imgWidth;

        // Clear canvas.
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.strokeStyle = "#FFFFFF";
        this.ctx.fillRect(0, 0, imgWidth, imgHeight);

        // Draw finder patterns.
        const finderOffset = Writer.SYMBOL_DIM * 1.5;
        this.drawFinderPattern({ x: finderOffset, y: finderOffset });
        this.drawFinderPattern({ x: imgWidth - finderOffset, y: finderOffset });
        this.drawFinderPattern({ x: finderOffset, y: imgHeight - finderOffset });

        // Draw alignment pattern.
        this.drawAlignmentPattern({ x: imgWidth - finderOffset, y: imgHeight - finderOffset});

        // Draw symbols.
        const gridOffset = Writer.SYMBOL_DIM * 2;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                this.drawSymbol(i, j, data[i * cols + j]);
            }
        }

        // Assign canvas to image. Assumes <img> tag dimensions are set.
        this.image.src = this.canvas.toDataURL();
    }

    private drawFinderPattern(centre: Point): void {
        this.ctx.moveTo(centre.x, centre.y);

        // Outer black circle.
        this.ctx.beginPath();
        this.ctx.fillStyle = "#000000";
        this.ctx.strokeStyle = "#000000";
        this.ctx.arc(centre.x, centre.y, Writer.FINDER_RADIUS, 0, Math.PI * 2, true);
        this.ctx.fill();

        // Middle white circle.
        this.ctx.beginPath();
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.strokeStyle = "#FFFFFF";
        this.ctx.arc(centre.x, centre.y, Writer.FINDER_RADIUS * 5 / 7, 0, Math.PI * 2, true);
        this.ctx.fill();

        // Inner black circle.
        this.ctx.beginPath();
        this.ctx.fillStyle = "#000000";
        this.ctx.strokeStyle = "#000000";
        this.ctx.arc(centre.x, centre.y, Writer.FINDER_RADIUS * 3 / 7, 0, Math.PI * 2, true);
        this.ctx.fill();
    }

    private drawAlignmentPattern(centre: Point): void {
        this.ctx.moveTo(centre.x, centre.y);

        this.ctx.beginPath();
        this.ctx.fillStyle = "#000000";
        this.ctx.strokeStyle = "#000000";
        this.ctx.arc(centre.x, centre.y, Writer.FINDER_RADIUS * 5 / 7, 0, Math.PI * 2, true);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.strokeStyle = "#FFFFFF";
        this.ctx.arc(centre.x, centre.y, Writer.FINDER_RADIUS * 3 / 7, 0, Math.PI * 2, true);
        this.ctx.fill();
    }

    private drawSymbol(row: number, col: number, mask: number): void {
        const startX = col * (Writer.SYMBOL_DIM + Writer.GAP_DIM) + Writer.GRID_OFFSET;
        const startY = row * (Writer.SYMBOL_DIM + Writer.GAP_DIM) + Writer.GRID_OFFSET;

        for (let b = 0; b < Writer.BITS_PER_SYMBOL; b++) {
            this.ctx.fillStyle = "#000000";
            this.ctx.strokeStyle = "#000000";
            this.ctx.fillRect(startX, startY + Writer.UNIT_DIM * b * 2,
                Writer.SYMBOL_DIM, Writer.UNIT_DIM);

            if ((mask & (1 << b)) === 0) {
                this.ctx.fillStyle = "#FFFFFF";
                this.ctx.strokeStyle = "#FFFFFF";
                this.ctx.fillRect(startX + Writer.UNIT_DIM * 4.5, startY + Writer.UNIT_DIM * b * 2,
                    Writer.UNIT_DIM * 2, Writer.UNIT_DIM);
            }
        }
    }
}
