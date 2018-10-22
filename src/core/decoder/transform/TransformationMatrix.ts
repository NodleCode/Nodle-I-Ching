/**
 * 2D 3 x 3 matrix of numbers representing 2D transformation matrix.
 */
export class TransformationMatrix {
    private A: Float32Array[];

    constructor(other ?: TransformationMatrix) {
        this.A = [];
        for (let i = 0; i < 3; ++i) {
            this.A.push(new Float32Array(3));
        }
        if (other !== null && other !== undefined) {
            for (let i = 0; i < 3; ++i) {
                for (let j = 0; j < 3; ++j) {
                    this.A[i][j] = other.A[i][j];
                }
            }
        }
    }

    public get(x: number, y: number): number {
        return this.A[x][y];
    }

    public set(x: number, y: number, val: number) {
        this.A[x][y] = val;
    }

    /**
     * Calculates the dot product between certain row and other vector.
     *
     * @param {number} row - Row number
     * @param {number[]} other - Vector to multiply the row with
     * @returns {number} - Dot product result
     * @memberof TransformationMatrix
     */
    public dotRow(row: number, other: number[]): number {
        if (other.length !== 3) {
            throw new Error("The Other vector has to be of length 3!");
        }
        return this.A[row][0] * other[0] + this.A[row][1] * other[1] + this.A[row][2] * other[2];
    }

    /**
     * Calculates the dot product between certain column and other vector.
     *
     * @param {number} col - Column number
     * @param {number[]} other - Vector to multiply the column with
     * @returns {number} - Dot product result
     * @memberof TransformationMatrix
     */
    public dotColumn(col: number, other: number[]): number {
        if (other.length !== 3) {
            throw new Error("The Other vector has to be of length 3!");
        }
        return this.A[0][col] * other[0] + this.A[1][col] * other[1] + this.A[2][col] * other[2];
    }

    /**
     * Calculate the cofactor matrix in order to calculate the adjugate matrix.
     * @see https://en.wikipedia.org/wiki/Minor_(linear_algebra)#Inverse_of_a_matrix
     *
     * @returns {TransformationMatrix} - Cofactor matrix
     * @memberof TransformationMatrix
     */
    public cofactor(): TransformationMatrix {
        const cofactorMatrix = new TransformationMatrix();
        const B = cofactorMatrix.A;
        const A = this.A;
        for (let i = 0, sign = 1; i < 3; ++i) {
            for (let j = 0; j < 3; ++j, sign *= -1) {
                const rows: number[] = [];
                const cols: number[] = [];
                for (let k = 0; k < 3; ++k) {
                    // skip each element row and column to calculate the determinates.
                    if (k !== i) {
                        rows.push(k);
                    }
                    if (k !== j) {
                        cols.push(k);
                    }
                }
                // calculate each deteminante value.
                B[i][j] = sign * (
                    A[rows[0]][cols[0]] * A[rows[1]][cols[1]] -
                    A[rows[0]][cols[1]] * A[rows[1]][cols[0]]
                );
            }
        }
        return cofactorMatrix;
    }

    /**
     * Calculates the matrix transpose.
     *
     * @returns {TransformationMatrix} - Matrix transpose
     * @memberof TransformationMatrix
     */
    public transpose(): TransformationMatrix {
        const transposed = new TransformationMatrix();
        const B = transposed.A;
        const A = this.A;
        for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 3; ++j) {
                B[j][i] = A[i][j];
            }
        }
        return transposed;
    }

    /**
     * Calculates the adjugate matrix.
     * @see https://en.wikipedia.org/wiki/Adjugate_matrix
     *
     * @returns {TransformationMatrix}
     * @memberof TransformationMatrix - Adjugate matrix
     */
    public adjugate(): TransformationMatrix {
        return this.cofactor().transpose();
    }

    /**
     * Multiplies by another matrix.
     *
     * @param {TransformationMatrix} other
     * @returns {TransformationMatrix} - Multiplications result
     * @memberof TransformationMatrix
     */
    public times(other: TransformationMatrix): TransformationMatrix {
        const result = new TransformationMatrix();
        const C = result.A;
        const B = other.A;
        const A = this.A;
        for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 3; ++j) {
                C[i][j] = 0;
                for (let k = 0; k < 3; ++k) {
                    C[i][j] += A[i][k] * B[k][j];
                }
            }
        }
        return result;
    }

}
