/**
 * @file sobel.js
 * @brief Edge Detection operators
 * Implements OpenGL GLSL Shaders for fast gradient @em (edges) extraction
 *
 * @ingroup EdgeDetection
 *
 *
 * \copyright
 * Copyright (c) 2017 fiveko.com .
 * See the LICENSE file for copying permission.
 */

/**
 * @defgroup EdgeDetection Edge Detection
 * @{
 *     Different edge detection algorithms
 *     
 * @}
 */
 
"use strict";

(function(filters) {

const shaderSource = `
precision mediump float;

#define KERNEL_SIZE 3
// our texture
uniform sampler2D u_image;
uniform vec2 u_textureSize;
uniform float u_kernel[KERNEL_SIZE];
#define M_PI 3.14159265359
#define GET_PIXEL(_x, _y) (texture2D(u_image, textCoord + onePixel*vec2(_x, _y)))
 

void main() {
	vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
	vec2 textCoord = gl_FragCoord.xy / u_textureSize;
	float dx = (length(GET_PIXEL(-1, -1)*u_kernel[0] +
				GET_PIXEL(-1,  0)*u_kernel[1] +
				GET_PIXEL(-1, +1)*u_kernel[2]) -
			   length(GET_PIXEL(+1, -1)*u_kernel[0] +
				GET_PIXEL(+1,  0)*u_kernel[1] +
				GET_PIXEL(+1, +1)*u_kernel[2]));
	float dy = (length(GET_PIXEL(-1, -1)*u_kernel[0] +
				GET_PIXEL(0, -1)*u_kernel[1] +
				GET_PIXEL(+1, -1)*u_kernel[2]) -
			   length(GET_PIXEL(-1, +1)*u_kernel[0] +
				GET_PIXEL(0, +1)*u_kernel[1] +
				GET_PIXEL(+1, +1)*u_kernel[2]));

   ///gl_FragColor = vec4(vec3(length(vec2(dx, dy))), 1.0);
   float theta = (atan(dy, dx) + M_PI) / (2.0*M_PI);
   gl_FragColor = vec4(length(vec2(dx, dy)), theta, 0.0, 1.0);
}`;

const shaderSourceNMS = `
precision mediump float;

#define KERNEL_SIZE 3
// our texture
uniform sampler2D u_image;
uniform vec2 u_textureSize;
#define M_PI 3.1415926535897932384626433832795

void main() {
	vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
	vec2 textCoord = gl_FragCoord.xy / u_textureSize;
	vec4 cc = texture2D(u_image, textCoord);   
	float theta = degrees(cc.y*M_PI*2.0); 
	int ax = 0, ay = 0; 
	if ((theta >= 337.5) || (theta < 22.5))       { ax = 1; ay = 0; }
	else if ((theta >= 22.5) && (theta < 67.5))   { ax = 1; ay = 1; }
	else if ((theta >= 67.5) && (theta < 112.5))  { ax = 0; ay = 1; }
	else if ((theta >= 112.5) && (theta < 157.5)) { ax =-1; ay = 1; }
	else if ((theta >= 157.5) && (theta < 202.5)) { ax =-1; ay = 0; }
	else if ((theta >=202.5) && (theta < 247.5))  { ax =-1; ay =-1; }
	else if ((theta >=247.5) && (theta < 292.5))  { ax = 0; ay =-1; }
	else if ((theta >= 292.5) && (theta < 337.5)) { ax = 1; ay =-1; }

	vec4 ca = texture2D(u_image, textCoord + onePixel*vec2(ax, ay));
	vec4 cb = texture2D(u_image, textCoord + onePixel*vec2(-ax, -ay));
	gl_FragColor = vec4((((cc.x <= ca.x) || (cc.x < cb.x)) ? vec3(0) : vec3(cc.x)), 1.0);
}`;

function applyNMS(self){
	var gl = self.gl;
	var program = self.createProgram("edgeNMS", shaderSourceNMS);
	
	self.execute(program);
}

function apply(self, kernel){
	var gl = self.gl;
	var program = self.createProgram("sobel", shaderSource);
	
	var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
	gl.uniform1fv(kernelLocation, kernel);
	
	self.execute(program);
	applyNMS(self);
}

/** 
 * Sobel-Federman edge detection.
 * Implements <b>Sobel–Feldman</b> gradient operator using GPU shaders.
 * The resulting gradient image is with thin edges after a <b>Non-maximum suppression</b> procedure.
 *
 * @ingroup EdgeDetection
 *
 * @par Overview
 * The Sobel operator is a fundamental part in many <b>Computer Vision</b> algorithms.
 * It convolves two 3x3 kernels to approximate image derivative and extract gradients.
 * @par Math Theory
 * @li \f$\displaystyle{G}{x}={\left[\begin{matrix}+{1}&{0}&-{1}\\+{2}&{0}&-{2}\\+{1}&{0}&-{1}\end{matrix}\right]}={\left[\begin{matrix}{1}\\{2}\\{1}\end{matrix}\right]}\ast{\left[\begin{matrix}{1}&{0}&-{1}\end{matrix}\right]}\f$
 * @li \f$\displaystyle{G}{y}={\left[\begin{matrix}+{1}&+{2}&+{1}\\{0}&{0}&{0}\\-{1}&-{2}&-{1}\end{matrix}\right]}={\left[\begin{matrix}{1}\\{0}\\-{1}\end{matrix}\right]}\ast{\left[\begin{matrix}{1}&{2}&{1}\end{matrix}\right]}\f$
 * @li Gradient magnitute: \f$\displaystyle{G}=\sqrt{{{G}{x}^{2}+{G}{y}^{2}}}\f$
 * @li Gradient direction: \f$\displaystyle\theta={a} \tan{{\left(\frac{{{G}{x}}}{{{G}{y}}}\right)}}\f$
 *
 *
 * @par Example image result
 * @image html sobel_nms_ex.jpg "Clippers edge detection with Sobel operator"
 * @par External resources
 * @li <a href="http://fiveko.com/tutorials/image-processing/sobel-filter/">Sobel Filter Tutorial</a> 
 * 
 * @see schaar
*/
filters.prototype.sobel = function() {
	apply(this, [1, 2, 1]);
}


/** 
 * Schaar edge detection.
 * Implements <b>Schaar</b> gradient operator using GPU shaders.
 *
 * @ingroup EdgeDetection
 *
 * @par Overview
 * The Schaar operator is an alternative to @ref sobel edge detector. Schaar edge detector aims to improve rotational symmetry. 
 * The most frequently used two 3x3 kernels are:
 * @li \f$\displaystyle{G}{x}={\left[\begin{matrix}+{3}&{0}&-{3}\\+{10}&{0}&-{10}\\+{3}&{0}&-{3}\end{matrix}\right]}\f$
 * @li \f$\displaystyle{G}{y}={\left[\begin{matrix}+{3}&+{10}&+{3}\\{0}&{0}&{0}\\-{3}&-{10}&-{3}\end{matrix}\right]}\f$
 *
 * @see sobel
*/
filters.prototype.schaar = function() {
	apply(this, [3, 10, 3]);
}

})(window.FivekoGFX);