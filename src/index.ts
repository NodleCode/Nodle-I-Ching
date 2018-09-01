// test interface, feel free to remove it
export interface IIChing {
    binaryData: number[];
    data: string;
    chunks: string;
    location: {
        topRightCorner: number;
        topLeftCorner: number;
        bottomRightCorner: number;
        bottomLeftCorner: number;

        topRightFinderPattern: number;
        topLeftFinderPattern: number;
        bottomLeftFinderPattern: number;

        bottomRightAlignmentPattern?: number;
    };
}
