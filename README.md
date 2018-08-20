# fivekogfx
FivekoGFX ([Fiveko Graphics](http://fiveko.com/projects/fivekogfx-image-processing-library/)) is a tiny Image Processing Library. The main code base of FivekoGFX is written in JavaScript and OpenGL shaders (GLSL). FivekoGFX is a web-based image processing lib and it tries to provide optimal solutions and take advantage of the GPU power (where possible). 

You are also wlcome to visit [fiveko.com](http://fiveko.com/).

# Features
## Different image processing filters and transformations like:
- Convolution operator - 2D masks and 1D separable kernels
- Gaussian blur
- Sobel edge detection
- Mean filter
- Symmetric Nearest Neighbour filter (Symmetric NN)
- Hough transform
- Watershed trasnform (currently Meyer's flooding algorithm)
 [<img src="assets/Watershed.png?raw=true" title="Meyer's flooding algorithm">](http://fiveko.com/tutorials/image-processing/watershed-image-segmentation/)
 
- Color space conversions (e.g. RGB <-> YCbCr, RGB to Grayscale, RGB to HSL, etc)
- Color tracking by Back Projection
- Histogram equalization
- Cartesian plane to Log-Polar image transform
- Local Binary Patterns (LBP)

### For more visit our [Computer Vision Tutorials and Examples](http://fiveko.com/tutorials/image-processing/)

## Input formats:
 - Major image files like: JPEG, PNG, WEBP, BMP, etc. 
 - Major Video files
 - Camera support (have in mind the web browser capabilites)
 
 # Demo application
 The project provide an internal **demo/test** application you can use to test and see most fivekogfx's features.
 
# Getting started
## Loading and installing 
### Browser
Download the whole fivekogfx or just the **/src/fivekogfx.min.js** and include it into your HTML5 proect e.g.:

```html
<script src="fivekogfx.min.js"></script>
```
## How to use the FivekoGFX API
### Gaussian blur:
Example of Gaussian filter over a canvas image with standart deviation of 2.0 

```javascript
var fivekogfx = new FivekoGFX();
fivekogfx.load(canvas);
fivekogfx.gauss(2.0); // e.g. Sigma=2.0
fivekogfx.draw(canvas);
``` 
### Convolution
Example of Discrete Gaussian blur approximation with standard deviation of 1.0

```javascript
var fivekogfx = new FivekoGFX();
fivekogfx.load(canvas);
fivekogfx.conv1d([1, 4, 7, 4, 1]); // Blur filter
fivekogfx.draw(canvas);
``` 

### Color space conversions
Example of RGB to Grayscale conversion
```javascript
var fivekogfx = new FivekoGFX();
fivekogfx.load(canvas);
fivekogfx.rgb2gray();
fivekogfx.draw(canvas);
``` 

 
