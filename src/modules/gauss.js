/**
 * Copyright (c) 2017 fiveko.com
 * See the LICENSE file for copying permission.
 */
 
"use strict";

(function(filters) {

const GAUSSKERN_MAX = 15; // Make sure it is uneven
const shaderSoruce = `
precision mediump float;

// our texture
uniform sampler2D u_image;

#define KERNEL_SIZE ` + GAUSSKERN_MAX + `
uniform vec2 u_textureSize;
uniform int u_direction;
uniform float u_kernel[KERNEL_SIZE];
void main() {
	vec2 textCoord = gl_FragCoord.xy / u_textureSize;
	vec2 onePixel = ((u_direction == 0) ? vec2(1.0, 0.0) : vec2(0.0, 1.0)) / u_textureSize;
	vec4 meanColor = vec4(0);
	int ms = KERNEL_SIZE / 2;
	for (int i = 0; i < KERNEL_SIZE; i++)
	{
		meanColor += texture2D(u_image, textCoord  + onePixel*vec2(i - ms))*u_kernel[i];
	}
	gl_FragColor = meanColor;
}`;

function makeKernel(sigma){
	var sqrtSigmaPi2 = Math.sqrt(Math.PI*2.0)*sigma;
	var sum = 0.0;
	const dim = GAUSSKERN_MAX;

	var s2 = 2.0*sigma * sigma;
	var i, j, c = parseInt(dim / 2);
	var kernel = new Float32Array(dim); // make kernel size equal to GAUSSKERN_MAX (WebGL Shader)
	for (j = 0, i = -c; j < dim; i++, j++) 
	{
		kernel[j] = Math.exp(-(i*i)/(s2)) / sqrtSigmaPi2;
		sum += kernel[j];
	}

	// Normalize the gaussian kernel to prevent image drakening/brightening
	for (i = 0; i < dim; i++) 
	{
		kernel[i] /= sum;
	}
	//console.log(kernel);
	
	return kernel;
}

filters.prototype.gauss = function(sigma) {
	var gl = this.gl;
	var params = this.params["gauss"];
	if (!params || params.sigma !== sigma){
		params = {sigma: sigma, kernel: makeKernel(sigma)};
		this.params["gauss"] = params;
	}
	var program = this.createProgram("gauss", shaderSoruce);
	var kernel = params.kernel;
	gl.useProgram(program);
	var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
	var directionLocation = gl.getUniformLocation(program, "u_direction");
	gl.uniform1fv(kernelLocation, kernel);
	
	for (var i = 0; i < 2; i++)
	{
		gl.uniform1i(directionLocation, i);
		this.execute(program);
	}
}

})(window.FivekoGFX);