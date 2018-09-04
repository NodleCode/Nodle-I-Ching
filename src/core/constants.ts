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
