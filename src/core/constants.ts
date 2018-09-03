export const Constants = {
    VERSION: 0,
    SPECS: {
        ROWS: 8,
        COLS: 8,
    },
    MAPPING_TABLE: [
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
        -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
        41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1,
        -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
        15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
    ],
};

/**
 * Grayscale conversion cofficients.
 * ITU-R recommendation (BT.709).  This formula, sometimes called Luma
 * Gray = (Red * 0.2126 + Green * 0.7152 + Blue * 0.0722)
 */
export const TO_GRAY = {
    RED: 0.2126,
    GREEN: 0.7152,
    BLUE: 0.0722,
};

/**
 * block size for the local mean calculations required in the adaptive thresholding algorithm.
 */
export const BLOCK_SIZE = 8;
/**
 * Constant substracted from the local mean value for each block.
 */
export const MEAN_CONST = 7;

/**
 * Maximum possible variance for a block in order to be considered from the same color.
 */
export const MAX_VARIANCE = 25;
