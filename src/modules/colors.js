/**
* @file colors.js
* @brief Different color-space conversions
*
*
* @ingroup ColorSpace
*
* @section intro_sec External resources
* @li <a href="http://fiveko.com/tutorials/image-processing/color-space-conversion/">Color-Space Conversions Tutorial</a> 
* 
* \copyright
* Copyright (c) 2017-2019 fiveko.com .
* See the LICENSE file for copying permission.
*/

/**
* @defgroup ColorSpace Color-Space Conversions
* @{
*     This group provides different @b GPU based color space conversion algorithms.
*     The color conversions are done using @b OpenGL @em (WebGL) shaders for fast GPU transformations
      @li @ref rgb2grey "RGB to Grayscale"
      @li @ref rgb2ycbcr "RGB to YCbCr"
      @li @ref rgb2ycbcr "YCbCr to RGB"
      @li RGB to HSL
      @li RGB to XYZ
      @li RGB to Skin map
*
* @}
* @ingroup FivekoGFX
*/

"use strict";

(function(filters) {


// Using Y component from YCbCr [0-255]
const shaderSourceRGB2GREY = `
precision mediump float;

// our texture
uniform sampler2D u_image;
uniform vec2 u_textureSize;
vec4 scale = vec4(0.299,  0.587,  0.114, 0.0);
void main() {
	vec4 color = texture2D(u_image, gl_FragCoord.xy / u_textureSize);
	gl_FragColor = vec4(vec3(dot(color,scale)), color.a);
}`;


// https://en.wikipedia.org/wiki/YCbCr
const shaderSourceRGB2YCbCr = `
precision mediump float; 

// our texture
uniform sampler2D u_image;
uniform vec2 u_textureSize; 
mat4 scale =   mat4(0.257,  0.504,  0.098, 0.0, 
                   -0.148, -0.291,  0.439, 0.0, 
                    0.439, -0.368, -0.071, 0.0, 
                    1.0, 1.0,  1.0, 1.0 );

void main() {
	vec4 color = texture2D(u_image, gl_FragCoord.xy / u_textureSize);
	gl_FragColor = color*scale + vec4(0.0625, 0.5, 0.5, 0);
}`;

const shaderSourceYCbCr2RGB = `
precision mediump float;

// our texture
uniform sampler2D u_image;
uniform vec2 u_textureSize;
mat4 scale =   mat4(1.164,  0.000,  1.596, 0.0,
                    1.164, -0.392, -0.813, 0.0,
                    1.164,  2.017,  0.000, 0.0,
                    1.0, 1.0,  1.0, 1.0 );

void main() {
	vec4 color = texture2D(u_image, gl_FragCoord.xy / u_textureSize);
	gl_FragColor = (color- vec4(0.0625, 0.5, 0.5, 0))*scale ;
}`;

// http://www.wseas.us/e-library/conferences/2011/Mexico/CEMATH/CEMATH-20.pdf
const shaderSourceSkinMask = `
precision mediump float;
// our texture
uniform sampler2D u_image;
uniform vec2 u_textureSize;
vec4 thr = vec4(80.0/255.0, 120.0/255.0, 133.0/255.0, 173.0/255.0);
void main() {
	vec4 color = texture2D(u_image, gl_FragCoord.xy / u_textureSize);
	gl_FragColor = vec4(vec3(( (color[0] > thr[0]) && 
				(color[1] >= thr[0]) && (color[1] <= thr[1]) && 
				(color[2] >= thr[2]) && (color[2] <=thr[3])) ? 1.0 : 0.0), 
				color.a);
}`;


// https://en.wikipedia.org/wiki/SRGB
//Observer. = 2°, Illuminant = D65
const shaderSourceRGB2XYZ = `
precision mediump float;

// our texture
uniform sampler2D u_image;
uniform vec2 u_textureSize;
#define SCALE(_c) (((_c) > 0.04045) ? (pow(((_c) + 0.055 ) / 1.055, 2.4)) : ((_c)/ 12.92))
mat4 scale =   mat4(0.4124,  0.3576,  0.1805, 0.0, 
                    0.2126,  0.7152,  0.0722, 0.0, 
                    0.0193,  0.1192,  0.9505, 0.0, 
                    1.0, 1.0,  1.0, 1.0 );
void main() {
	vec4 color = texture2D(u_image, gl_FragCoord.xy / u_textureSize);
	vec4 rgb = vec4(SCALE(color.r), SCALE(color.g), SCALE(color.b), color.a); 
	gl_FragColor = rgb*scale;
}`;

// https://support.microsoft.com/en-us/help/29240/how-to-converting-colors-between-rgb-and-hls-hbs
const shaderSourceRGB2HSL = `
precision mediump float;

// our texture
uniform sampler2D u_image;
uniform vec2 u_textureSize;

void main() {
	vec4 color = texture2D(u_image, gl_FragCoord.xy / u_textureSize);
	float cMin = min(min(color.r, color.g), color.b);
	float cMax = max(max(color.r, color.g), color.b);
	float L = (cMax + cMin)/(2.0);
	
	if (cMin == cMax){
		gl_FragColor = vec4(vec3(0, 0, L), color.a); 
		return;
	}
	// Calc Saturation
	float delta = (cMax - cMin);
	float S = ((L > 0.5) ? (delta / (2.0 - cMax - cMin)) : (delta / (cMax + cMin)));
	
	// Calc Hue
	float H = (color.r == cMax) ? (((color.g - color.b) / delta)) :
				((color.g == cMax) ? (2.0 + (color.b - color.r) / delta) :
				((4.0 + (color.r - color.g) / delta)));
	H = ((H < 0.0) ? (H + 6.0) : H) / 6.0;
	gl_FragColor = vec4(vec3(H, S, L), color.a);
}`;

const shaderSourceColorMap = `
precision mediump float;

// our texture
uniform vec2 u_textureSize;
uniform sampler2D u_image;
uniform sampler2D u_colorTable;

void main() {
	vec2 pos = vec2(texture2D(u_image, gl_FragCoord.xy / u_textureSize).x, 0.0);
	vec4 color = texture2D(u_colorTable, pos);
	
	gl_FragColor = color;
}`;

const shaderSourceRGB2BIN = `
precision mediump float;

// our texture
uniform vec2 u_textureSize;
uniform sampler2D u_image;
uniform vec4 u_threshold;

void main() {
	vec4 color = texture2D(u_image, gl_FragCoord.xy / u_textureSize);
	
	gl_FragColor = vec4(greaterThan(color, u_threshold));
}`;

function execute(name, shader){
	var gl = this.gl;
	var program = this.createProgram(name, shader);
	this.execute(program);
}

/**
 * RGB to Grayscale color space tranform
 * @ingroup ColorSpace
 *
 *
 * @par Overview
 * This method implements RGB to gray transformation using Y (lume) compoenent from YCbCr @em color-space.
 *
 * @par Example image result
 * @image html rgb2gray_ex.jpg "RGB to Gray-scale image transform"
 * @par External resources
 * @li <a href="http://fiveko.com/tutorials/image-processing/color-space-conversion/#rgb2grey" target="_blank">Color-Space Conversion Tutorial</a> 
 * 
 * @see rgb2ycbcr
*/
filters.prototype.rgb2grey = function() {
	execute.call(this, "rgb2grey", shaderSourceRGB2GREY);
}

filters.prototype.rgb2luma = function() {
	execute.call(this, "rgb2lum", shaderSourceRGB2LUMA);
}

/**
 * RGB to YCbCr color space tranform
 * @ingroup ColorSpace
 *
 * @par Overview
 * This method implements RGB to YCbCr transformation using the math equation below. 
 * The expected input is in range @em [0 – 255] or in @em [0.0 - 1.0] for @b OpenGL GLSL shader.
 * The output values are in range [16 – 235] for @em Y and [16 – 240] for @em Cb and @em Cr color components.
 *
 * @par Math theory
 * \f$\displaystyle{\left[\begin{matrix}{Y}\\{C}{b}\\{C}{r}\end{matrix}\right]}={\left[\begin{matrix}{0.0625}\\{0.5}\\{0.5}\end{matrix}\right]}+{\left[\begin{matrix}{0.257}&{0.504}&{0.098}\\-{0.148}&-{0.291}&{0.439}\\{0.439}&-{0.368}&-{0.071}\end{matrix}\right]}{\left[\begin{matrix}{R}\\{G}\\{B}\end{matrix}\right]}\f$
 *
 * @par Example image result
 * @image html rgb2ycbcr_ex.jpg "RGB to YCbCr image transform"
 * @par External resources
 * @li <a href="http://fiveko.com/tutorials/image-processing/color-space-conversion/#rgb2ycbcr" target="_blank">Color-Space Conversion Tutorial</a> 
 * @li <a href="https://en.wikipedia.org/wiki/YCbCr" target="_blank" rel="nofollow noopener">Wikipedia - YCbCr</a> 
 * 
 * @see rgb2grey ycbcr2rgb
*/
filters.prototype.rgb2ycbcr = function() {
	execute.call(this, "rgb2ycbcr", shaderSourceRGB2YCbCr);
}

/**
 * YCbCr to RGB color space tranform
 * @ingroup ColorSpace
 *
 * @par Overview
 * This method implements YCbCr to RGB transformation using the math equation below. 
 * The output values are in range [0 – 255] for @em Y and [16 – 240] for @em Cb and @em Cr color components.
 *
 * @par Math theory
 * \f$\displaystyle{\left[\begin{matrix}{R}\\{G}\\{B}\end{matrix}\right]}={\left[\begin{matrix}{1.164}&{0.000}&{1.596}\\{1.164}&-{0.392}&-{0.813}\\{1.164}&{2.017}&{0.000}\end{matrix}\right]}-{\left[\begin{matrix}{0.0625}\\{0.5}\\{0.5}\end{matrix}\right]}{\left[\begin{matrix}{Y}\\{C}{b}\\{C}{r}\end{matrix}\right]}\f$
 *
 * @par External resources
 * @li <a href="http://fiveko.com/tutorials/image-processing/color-space-conversion/#ycbcr2rgb" target="_blank">Color-Space Conversion Tutorial</a> 
 * 
 * @see rgb2ycbcr
*/
filters.prototype.ycbcr2rgb = function() {
	execute.call(this, "ycbcr2rgb", shaderSourceYCbCr2RGB);
}

filters.prototype.skinMask = function() {
	var gl = this.gl;
	var program = this.createProgram("skinMask", shaderSourceSkinMask);
	
	this.rgb2ycbcr();
	
	gl.useProgram(program);
	this.execute(program);
}

filters.prototype.rgb2xyz = function() {
	execute.call(this, "rgb2xyz", shaderSourceRGB2XYZ);
}

filters.prototype.rgb2hsl = function() {
	execute.call(this, "rgb2hsl", shaderSourceRGB2HSL);
}

// Map a histogram LUT to an image. So far a Grayscale one
filters.prototype.colormap = function(table){
	var gl = this.gl;
	var program = this.createProgram("colormap", shaderSourceColorMap);
	gl.useProgram(program);
	
	this.makeTextImage2D(program, 1, "u_colorTable", 
				table.length, 1, 
				gl.LUMINANCE, gl.UNSIGNED_BYTE, table);
	
	this.execute(program);
}

/*
* Simple and fast image binarization
* thresholds - vec4 array of float RGBA thresholds
*/
filters.prototype.rgb2bin = function(thresholds) {
	var gl = this.gl;
	var program = this.createProgram("rgb2bin", shaderSourceRGB2BIN);
	
	gl.uniform4fv(gl.getUniformLocation(program, "u_threshold"), thresholds);
	this.execute(program);
}

})(window.FivekoGFX);
