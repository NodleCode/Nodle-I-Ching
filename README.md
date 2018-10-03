# IChing-JS

An IChing encoding and decoding library written in typescript for use in javascript-based web apps.

## Installation

Clone the repository and run `npm install --no-save` followed by `npm run build`.

### Node.js

The Node.js files can be found in `./lib/esm5` after building.

### Javascript

This library can be used in javascript by including `./lib/umd/index.min.js` as script source.

## Usage

### Encoding

IChing-JS library exports a method `iching.encode(payload, options?)`.

#### Arguments
- `payload` - A string of alphanumeric characters that is the desired payload of the IChing.
- `options` (optional) - Additional options:
    - `ECLevel` - Error correction level, a number between 0 and 1 representing the maximum percentage of errors that can be corrected, relative to the payload length. Defaults to [`Encoder.EC_MEDIUM`](./src/core/encoder/Encoder.ts#L34) (0.15).
    - `Resolution` - A number representing the width and height of the square image produced by the method. Defaults to 1250.

#### Return Value
If the encoding process succeeds, the method will return an object that implements the [`EncodedIChing`](./src/core/encoder/EncodedIChing.ts) interface.

#### Example
Example usage with options specified:
```javascript
const payload = "thisisanexample123";
const options = { 'ECLevel': 0.5, 'Resolution': 2000 };
const encoded = iching.encode(payload, options);
```
Or without options:
```javascript
const payload = "thisisanexample123";
const encoded = iching.encode(payload);
```
Which is equivalent to:
```javascript
const payload = "thisisanexample123";
const defaultOptions = { 'ECLevel': 0.15, 'Resolution': 1250 };
const encoded = iching.encode(payload, defaultOptions);
```
Image can be displayed using HTML canvas:
```javascript
// 'cvs' and 'ctx' are an HTML canvas element, and its 2D rendering context, respectively.
const imgData = encoded.imageData;
cvs.width = imgData.width;
cvs.height = imgData.height;
const ctxImgData = new ImageData(imgData.data, imgData.width, imgData.height);
ctx.putImageData(ctxImgData, 0, 0);

// If 'img' is an HTML image element, its 'src' attribute can be set like follows:
img.src = cvs.toDataURL();
```

### Decoding

IChing-JS library exports a method `iching.decode(imageData, width, height)`.

#### Arguments
- `imageData` - A `Uint8ClampedArray` of RGBA pixel values in the form `[r0, g0, b0, a0, r1, g1, b1, a1, ...]`. The length of this array should be `4 * width * height`.
- `width` - The width of the image to be decoded.
- `height` - The height of the image to be decoded.

#### Return value
If the decoding process succeeds, the method will return an object that implements the [`DecodedIChing`](./src/core/decoder/DecodedIChing.ts) interface.

#### Example
Example usage:
```javascript
// Let 'width' and 'height' be the width and height of the input image, respectively,
// and 'imageData' be a Uint8ClampedArray of RGBA pixel values, and of length 4 * width * height.
const decoded = iching.decode(imageData, width, height);
console.log(decoded.version, decoded.size);
console.log(decoded.data);
```

## Documentation
Detailed HTML docs can be found [here](./docs/index.html).