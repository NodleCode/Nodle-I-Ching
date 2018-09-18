import { Encoder } from "../../core/encoder";

const longPayload = "this0payload1is2too3long4for5high6error7correction8level9";
const invalidPayload = "spaces are not supported";
const payload = "validpayload";
const ReedSolomonError = "Reed-Solomon error!";

describe("Encoder", () => {
    it("Throws an error when payload is empty", () => {
        expect(() => Encoder.encode("")).toThrowError("Empty payload!");
    });

    it("Throws an error when payload and error correction level combination is too big", () => {
        expect(() => Encoder.encode(longPayload)).toThrowError(
            "Payload and error correction level combination is too big!",
        );
    });

    it("Throws an error if payload contains invalid character", () => {
        expect(() => Encoder.encode(invalidPayload)).toThrowError("Invalid character in payload!");
    });

    it("Calculates the correct size of the IChing code", () => {
        const encodedPayload = Encoder.encode(payload, Encoder.EC_HIGH);
        expect(encodedPayload.rows).toBe(5);
        expect(encodedPayload.cols).toBe(5);
    });
});
