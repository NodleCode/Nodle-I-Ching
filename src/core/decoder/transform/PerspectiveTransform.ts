/**
 * Most of this module logic is direct implementation of George Wolberg's book
 * "Digital Image Warping" section 3.4.2
 */
import { Point } from "../../geometry";
import { TransformationMatrix } from "./TransformationMatrix";

/**
 * @class PerspectiveTransform
 * @description Calculates perspective transformation matrix to transform any arbitrary
 * quadrilateral to another.
 * @export
 */
export class PerspectiveTransform {
    private mat: TransformationMatrix;
    /**
     * Creates an instance of PerspectiveTransform to transform any point prespective to
     *  match the distination quadrilateral prespective.
     * @param {Point[]} srcCorners - Source quadrilateral corner coordinates.
     * @param {Point[]} distCorners - Distination quadrilateral corner coordinates.
     * @memberof PerspectiveTransform
     */
    constructor(srcCorners: Point[], distCorners: Point[]) {
        if (srcCorners.length !== 4 || distCorners.length !== 4) {
            throw new Error("Both source and distination point have to be exactly four points!");
        }

        // Calculate transformation matrix to convert our quadrilateral to unit square then
        // another matrix to covert unit square to the destination quadrilateral.
        this.mat = this.quadrilateralToUnitSquareMatrix(
            srcCorners[0].x, srcCorners[0].y,
            srcCorners[1].x, srcCorners[1].y,
            srcCorners[2].x, srcCorners[2].y,
            srcCorners[3].x, srcCorners[3].y,
        ).times(this.unitSquareToQuadrilateralMatrix(
            distCorners[0].x, distCorners[0].y,
            distCorners[1].x, distCorners[1].y,
            distCorners[2].x, distCorners[2].y,
            distCorners[3].x, distCorners[3].y,
        ));
    }

    /**
     * Transform point according to the precalculated perspective transformation matrix
     *
     * @param {Point} srcPoint - Point to be transformed.
     * @returns {Point} - Transformed point
     * @memberof PerspectiveTransform
     */
    public transform(srcPoint: Point): Point {
        const denominator = this.mat.dotColumn(2, [srcPoint.x, srcPoint.y, 1]);
        return {
            x: this.mat.dotColumn(0, [srcPoint.x, srcPoint.y, 1]) / denominator,
            y: this.mat.dotColumn(1, [srcPoint.x, srcPoint.y, 1]) / denominator,
        };
    }

    /**
     * Calculates the transformation matrix any quadrilateral shape to unit square.
     * @see https://en.wikipedia.org/wiki/Minor_(linear_algebra)#Inverse_of_a_matrix
     *
     * @private
     * @param {number} xi - X cordinates for quadrilateral corner points.
     * @param {number} yi - Y cordinates for quadrilateral corner points.
     * @returns {TransformationMatrix}
     * @memberof PerspectiveTransform
     */
    private quadrilateralToUnitSquareMatrix(
        x0: number, y0: number,
        x1: number, y1: number,
        x2: number, y2: number,
        x3: number, y3: number,
    ): TransformationMatrix {
        // as described in the reference link Inv(A) = Adjugate(A) / det(A), but since
        // two matrices which are (nonzero) scalar multiples of each other are equivalent in
        // the homogeneous coordinate system, there is no need to divide by the determinant.
        return this.unitSquareToQuadrilateralMatrix(x0, y0, x1, y1, x2, y2, x3, y3).adjugate();
    }

    /**
     * Calculates the transformation matrix to transform unit square to any quadrilateral shape.
     *
     * @private
     * @param {number} xi - X cordinates for quadrilateral corner points.
     * @param {number} yi - Y cordinates for quadrilateral corner points.
     * @returns {TransformationMatrix}
     * @memberof PerspectiveTransform
     */
    private unitSquareToQuadrilateralMatrix(
        x0: number, y0: number,
        x1: number, y1: number,
        x2: number, y2: number,
        x3: number, y3: number,
    ): TransformationMatrix {
        // all function logic is direct implementation of
        // George Wolberg's book "Digital Image Warping" section 3.4.2
        const dx1 = x1 - x2;
        const dx2 = x3 - x2;
        const dx3 = x0 - x1 + x2 - x3;
        const dy1 = y1 - y2;
        const dy2 = y3 - y2;
        const dy3 = y0 - y1 + y2 - y3;

        const denominator = dx1 * dy2 - dx2 * dy1;
        const transformationMatrix = new TransformationMatrix();
        // If dx3 and dy3 is zeros, then that's an affine transformation and a02, a12 values will
        // be zeros resulting to simplify the output to affine transformation matrix.
        const a02 = (dx3 * dy2 - dx2 * dy3) / denominator;
        const a12 = (dx1 * dy3 - dx3 * dy1) / denominator;

        transformationMatrix.set(0, 0, x1 - x0 + a02 * x1);
        transformationMatrix.set(1, 0, x3 - x0 + a12 * x3);
        transformationMatrix.set(2, 0, x0);
        transformationMatrix.set(0, 1, y1 - y0 + a02 * y1);
        transformationMatrix.set(1, 1, y3 - y0 + a12 * y3);
        transformationMatrix.set(2, 1, y0);
        transformationMatrix.set(0, 2, a02);
        transformationMatrix.set(1, 2, a12);
        transformationMatrix.set(2, 2, 1.0);

        return transformationMatrix;
    }
}
