# fivekogfx
HTML5 Image Processing Library (JavaScript and WebGL)

For more information see here: [FivekoGFX](http://fiveko.com/)

# Features
Image Processing Filters like:
 - Gaussian blur
 - Sobel edge detection
 - Mean filter
 - Symmetric Nearest Neighbour filter (Symmetric NN)
 - Hough transform
 - Watershed trasnform (currently Meyer's flooding algorithm)
 
 ![Alt text](assets/Watershed.png?raw=true "Meyer's flooding algorithm")
 
 - Color space conversions (e.g. RGB <-> YCbCr, RGB to Grayscale, RGB to HSL, etc)
 - Color tracking by Back Projection
 - Histogram equalization
 - Cartesian plane to Log-Plar image transform
 - More TBD ...
 
Input formats:
 - Major image files like: JPEG, PNG, WEBP, BMP, etc. 
 - Major Video files
 - Camera support (have in mind the web browser capabilites)
 
 # Demo application
 The project provide an internal **demo/test** application you can use to test and see most fivekogfx's features.
 
# Getting started
### Loading and installing 
Download the whole fivekogfx or just the **/src/fivekogfx.min.js** and include it into your proect e.g.:

```html
<script src="fivekogfx.min.js"></script>
```
### How to use the FivekoGFX API
Below is an example of Gaussian blur over a canvas image:

```javascript
var fivekogfx = new FivekoGFX();
fivekogfx.load(canvas);
fivekogfx.gauss(2.0); // e.g. Sigma=2.0
fivekogfx.draw(canvas);
``` 
 # [Tutorials and more examples](http://fiveko.com/tutorials/image-processing/)
