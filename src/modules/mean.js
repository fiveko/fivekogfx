/**
 * Mean and Box filter GLSL shaders
 * Copyright (c) 2017 fiveko.com
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


filters.prototype.mean = function(size) {
	const kernelSize = parseInt(size) + !(size & 1); // Make it odd if not
	var gl = this.gl;
	var program = this.createProgram("mean_size_" + kernelSize, 
					shaderSoruce.replace(/%kernelSize%/g, kernelSize));
	gl.useProgram(program);
	var directionLocation = gl.getUniformLocation(program, "u_direction");
	// Split rows and cols
	gl.uniform2fv(directionLocation, [0, 1]);
	this.execute(program);
	gl.uniform2fv(directionLocation, [1, 0]);
	this.execute(program);
}

// Iterative blur using mean filter 
// iterations count is calculated using sigma param
filters.prototype.blur = function(sigma) {
	var count = (12*sigma*sigma) / (3*3-1);
	var gl = this.gl;
	var program = this.createProgram("blur3x3", shaderSoruce3x3);
	
	gl.useProgram(program);
	for (var i = 0; i < count; i++){
		this.execute(program);
	}
}

})(window.FivekoGFX);
