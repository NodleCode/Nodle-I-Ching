import { BitMatrix } from "../../BitMatrix";
import { distance } from "../../geometry";
import { PatternsLocation } from "../PatternsLocation";
import { PerspectiveTransform } from "./PerspectiveTransform";

/**
 * @export
 * @class CodeTransform
 * @description Transforms a BitMatrix perspective to match the standard IChing code perspective
 * with the finder patterns as corners.
 */
export class CodeTransform {
    /**
     * Transforms Bitmatrix perspective.
     *
     * @param {BitMatrix} srcMatrix - The original BitMatrix, to be transformed.
     * @param {PatternsLocation} patterns - The location of the corner patterns to guid the
     * new perspective.
     * @returns {BitMatrix} - The new transformed matrix.
     * @memberof CodeTransform
     */
    public transform(srcMatrix: BitMatrix, patterns: PatternsLocation): BitMatrix {
        // calculate the approximate dimensions of the embedded IChing code by taking the
        // average distance between vertical and horizontal patterns.
        const dimension = Math.round((
            distance(patterns.topLeft, patterns.topRight) +
            distance(patterns.topLeft, patterns.bottomLeft)
        ) / 2);

        // instead of mapping each pixel in the old matrix to its corresponding pixel/pixels in
        // the new matrix, we reversed the operation by mapping the new one to the old, that
        // makes better sense, since we don't have to compress or expand any pixels.
        // So we send the distination matrix corners as the source corners.
        const transformer = new PerspectiveTransform([
            { x: dimension - 1, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: dimension - 1 },
            { x: dimension - 1, y: dimension - 1 },
        ], [
            patterns.topRight,
            patterns.topLeft,
            patterns.bottomLeft,
            patterns.bottomRight,
        ]);

        const distMatrix = new BitMatrix(dimension, dimension);
        for (let x = 0; x < dimension; ++x) {
            for (let y = 0; y < dimension; ++y) {
                let srcPoint = transformer.transform({ x, y });
                srcPoint = { x: Math.round(srcPoint.x), y: Math.round(srcPoint.y) };
                // mapp each pixel in the new matrix to the corresponding pixel in the old one.
                distMatrix.set(x, y, srcMatrix.get(srcPoint.x, srcPoint.y));
            }
        }

        return distMatrix;
    }
}
