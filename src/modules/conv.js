/**
 * @file conv.js
 * @brief Generic Convolution GLSL Shaders
 * Generic Convolution GLSL Shaders
 *
 * @ingroup Convolution
 *
 *
 * \copyright
 * Copyright (c) 2017 fiveko.com
 * See the LICENSE file for copying permission.
 */

/**
 * @defgroup Convolution Generic Convolution Tools
 * @{   
 *     OpenGL shaders for convolution filters
 * @}
 */
"use strict";

(function(filters) {


const shaderSoruce2D = `
precision mediump float;

#define KERNEL_SIZE %kernelSize%
#define KERNEL_HALF KERNEL_SIZE / 2
// our texture
uniform sampler2D u_image;
uniform float u_kernel[KERNEL_SIZE*KERNEL_SIZE];
uniform vec2 u_textureSize;
#define GET_PIXEL(_x, _y)   texture2D(u_image, textCoord + onePixel*vec2((_x), (_y)))
#define imod(_x, _y)       int(mod(float(_x), float(_y)))

void main() {
	vec2 textCoord = gl_FragCoord.xy / u_textureSize;
	vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
	vec4 result = vec4(0.0);
	for (int k = 0; k < KERNEL_SIZE*KERNEL_SIZE; k++)
	{
		result += GET_PIXEL(imod(k, KERNEL_SIZE) - KERNEL_HALF, 
							k / KERNEL_SIZE - KERNEL_HALF)*u_kernel[k];
	}
	gl_FragColor = vec4(result.rgb, 1.0);
}`;

const shaderSoruce1D = `
precision mediump float;

#define KERNEL_SIZE %kernelSize%
#define KERNEL_HALF KERNEL_SIZE / 2
// our texture
uniform sampler2D u_image;
uniform float u_kernel[KERNEL_SIZE];
uniform vec2 u_direction;
uniform vec2 u_textureSize;

void main() {
	vec2 textCoord = gl_FragCoord.xy / u_textureSize;
	vec2 onePixel = u_direction / u_textureSize;
	vec4 result = vec4(0.0);
	for (int i = 0; i < KERNEL_SIZE; i++)
	{
		result += texture2D(u_image, textCoord + onePixel*vec2(i - KERNEL_HALF))*u_kernel[i];
	}
	gl_FragColor = vec4(result.rgb, 1.0);
}`;

function scaleKernel(kernel){
	const sum = (kernel.reduce((a, b) => a + b) || 1);
	return kernel.map(a => (a / sum));
}

/** 
 * Make a convolution with a 2D kernel.
 * The kernel will be directly scaled by scaleKernel
 * @ingroup Convolution
 * @param {array} kernel - 2D convolution kernel
*/
filters.prototype.conv2d = function(kernel) {
	const kernelSize = ~~Math.sqrt(kernel.length);
	var gl = this.gl;
	var program = this.createProgram("conv2d_size_" + kernelSize, 
					shaderSoruce2D.replace(/%kernelSize%/g, kernelSize));
	gl.useProgram(program);
	var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
	gl.uniform1fv(kernelLocation, scaleKernel(kernel));
	
	this.execute(program);
}

///< Enumeration for 1D convolution type
var CONV_TYPE = {
	ROWS: 0x01, ///< Rows convolution
	COLS: 0x02, ///< Cols convolution
	ALL:  0x03  ///< Separable 2D convolution (CONV_ROWS | CONV_COLS)
};

/**
 * Make a convolution with a 1D separable kernel.
 * The kernel will be directly scaled by scaleKernel.
 * The convolution is performed by rows and cols separable
 * @ingroup Convolution
 * @param {array} kernel - the kernel 1D vector
 * @param {CONV_TYPE} convType - CONV_TYPE such as COLS wise, ROWS wise or both
*/ 
filters.prototype.conv1d = function(kernel, convType) {
	const kernelSize = kernel.length + !(kernel.length & 1); // Make sure it is odd
	var gl = this.gl;
	var program = this.createProgram("conv1d_size_" + kernelSize, 
					shaderSoruce1D.replace(/%kernelSize%/g, kernelSize));
	gl.useProgram(program);
	
	var directionLocation = gl.getUniformLocation(program, "u_direction");
	var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
	gl.uniform1fv(kernelLocation, scaleKernel(kernel));
	
	// Split rows and cols and use CONV_TYPE if provided
	convType = convType || CONV_TYPE.ALL;
	if (convType & CONV_TYPE.COLS){
		gl.uniform2fv(directionLocation, [1, 0]);
		this.execute(program);
	}
	if (convType & CONV_TYPE.ROWS){
		gl.uniform2fv(directionLocation, [0, 1]);
	this.execute(program);
	}
}

filters.CONV_TYPE = CONV_TYPE;

})(window.FivekoGFX);
