/**
 * @file mean.js
 * @brief Mean smooth filters
 * Mean and Box filter GLSL shaders
 *
 * @ingroup SpatialFilters
 *
 * \copyright
 * Copyright (c) 2017-2019 fiveko.com .
 * See the LICENSE file for copying permission.
 */
 
"use strict";

(function(filters) {
/* 3x3 Mean Fragment Shader code */
const shaderSoruce3x3 = `
precision mediump float;

// our texture
uniform sampler2D u_image;
uniform vec2 u_textureSize;
void main() {
	vec2 textCoord = gl_FragCoord.xy / u_textureSize;
	vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
	gl_FragColor = (
		texture2D(u_image, textCoord + onePixel*vec2(-1.0, -1.0)) + 
		texture2D(u_image, textCoord + onePixel*vec2(0.0, -1.0)) + 
		texture2D(u_image, textCoord + onePixel*vec2(1.0, -1.0)) + 
		texture2D(u_image, textCoord + onePixel*vec2(-1.0, 0.0)) + 
		texture2D(u_image, textCoord + onePixel*vec2(0.0,  0.0)) + 
		texture2D(u_image, textCoord + onePixel*vec2(1.0,  0.0)) + 
		texture2D(u_image, textCoord + onePixel*vec2(-1.0, 1.0)) + 
		texture2D(u_image, textCoord + onePixel*vec2(0.0,  1.0)) + 
		texture2D(u_image, textCoord + onePixel*vec2(1.0,  1.0))) / 9.0;
}`;

/* Arbitrary size separable mean filter */ 
const shaderSoruce = `
precision mediump float;

#define KERNEL_SIZE %kernelSize%
#define KERNEL_HALF (KERNEL_SIZE / 2)
// our texture
uniform sampler2D u_image;
uniform vec2 u_textureSize;
uniform vec2 u_direction;

void main() {
	vec2 textCoord = gl_FragCoord.xy / u_textureSize;
	vec2 onePixel = u_direction / u_textureSize;
	vec4 meanColor = vec4(0.0);
	for (int i = -KERNEL_HALF; i <= KERNEL_HALF; i++)
	{
		meanColor += texture2D(u_image, textCoord + onePixel*vec2(i));
	}
	gl_FragColor = meanColor / float(KERNEL_SIZE);
}`;

/**
 * Low-pass mean filter
 * This filter performs <b>GPU</b> based separable mean filter by <em>OpenGL/WebGL</em> shader.
 * 
 *
 * @ingroup SpatialFilters
 * @param {uint} size - window size
 *
 * @par Math theory
 *  @li Mean blur with 3x3 kernel size:
 * \f$\displaystyle{K}=\frac{1}{{9}}{\left[\begin{matrix}{1}&{1}&{1}\\{1}&{1}&{1}\\{1}&{1}&{1}\end{matrix}\right]}=\frac{1}{{3}}{\left[\begin{matrix}{1}&{1}&{1}\end{matrix}\right]}\ast\frac{1}{{3}}{\left[\begin{matrix}{1}\\{1}\\{1}\end{matrix}\right]}\f$
 *
 * @par Example code
 * @code{.js}
  var fivekogfx = new FivekoGFX();
  fivekogfx.load(canvas);
  fivekogfx.mean(5); // e.g. Window size = 5
  fivekogfx.draw(canvas);
 * @endcode
 * @par Example image result
 * @image html mean_ex.jpg "Mean blur example image with window size 5"
 * @par External resources
 * @li <a href="http://fiveko.com/tutorials/image-processing/mean-filter-for-fast-noise-reduction/">Mean Filter Tutorial</a> 
 * 
 * @see gauss
*/
filters.prototype.mean = function(size) {
	const kernelSize = parseInt(size) + !(size & 1); // Make it odd if not
	var gl = this.gl;
	var program = this.createProgram("mean_size_" + kernelSize, 
					shaderSoruce.replace(/%kernelSize%/g, kernelSize));
	
	var directionLocation = gl.getUniformLocation(program, "u_direction");
	// Split rows and cols
	gl.uniform2fv(directionLocation, [0, 1]);
	this.execute(program);
	gl.uniform2fv(directionLocation, [1, 0]);
	this.execute(program);
}

/**
 * Iterative blur using mean filter. Number of iterations is calculated based on @em sigma parameter.
 *
 * @ingroup SpatialFilters
 * @param {float} sigma - standart deviation converted for iterations count
 *
 * @see mean gauss
 */
filters.prototype.blur = function(sigma) {
	var count = ~~Math.min((12*sigma*sigma) / (3*3-1), 100);
	var gl = this.gl;
	var program = this.createProgram("blur3x3", shaderSoruce3x3);
	
	for (var i = 0; i < count; i++){
		this.execute(program);
	}
}

})(window.FivekoGFX);
