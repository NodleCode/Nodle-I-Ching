/**
 * Interface to represent 2D point on image grid - could have floating-point coordinates
 *
 * @export
 * @interface Point
 */
export interface Point {
    x: number;
    y: number;
}

/**
 * Calculates the squared euclidean distance between two points.
 *
 * @export
 * @param {Point} a - The first point.
 * @param {Point} b - The second point.
 * @returns {number}
 */
export function sqDistance(a: Point, b: Point): number {
    return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
}

/**
 * Calculates the euclidean distance between two points.
 *
 * @export
 * @param {Point} a - The first point.
 * @param {Point} b - The second point.
 * @returns {number}
 */
export function distance(a: Point, b: Point): number {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}

/**
 * Calculates the vector a -> b (as a point).
 *
 * @export
 * @param {Point} a - The first vector point.
 * @param {Point} b - The second vector point.
 * @returns {Point} - vector(a -> b)
 */
export function vec(a: Point, b: Point): Point {
    return { x: b.x - a.x, y: b.y - a.y };
}

/**
 * Calculates the cross product magnitude between two vectors
 *
 * @export
 * @param {Point} a - The first vector.
 * @param {Point} b - The second vector.
 * @returns {number}
 */
export function cross(a: Point, b: Point): number {
    return a.x * b.y - a.y * b.x;
}

/**
 * Checks if two points are nearly the same.
 *
 * @export
 * @param {Point} a - The first point.
 * @param {Point} b - The second point.
 * @param {number} eps - Epsilon value which is the maximum distance between
 * two points to be considered equal.
 * @returns {boolean}
 */
export function nearlySame(a: Point, b: Point, eps: number): boolean {
    return Math.abs((a.x - b.x)) < eps && Math.abs(a.y - b.y) < eps;
}
