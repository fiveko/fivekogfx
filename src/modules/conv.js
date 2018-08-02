/**
 * Generic Convolution GLSL Shaders
 * Copyright (c) 2017 fiveko.com
 * See the LICENSE file for copying permission.
 */
 
"use strict";

(function(filters) {


const shaderSourceMask3x3 = `
precision mediump float;

#define KERNEL_SIZE 9
// our texture
uniform sampler2D u_image;
uniform vec2 u_textureSize;
uniform float u_kernel[KERNEL_SIZE];
#define GET_PIXEL(_x, _y) (texture2D(u_image, textCoord + onePixel*vec2(_x, _y)))

void main() {
	vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
	vec2 textCoord = gl_FragCoord.xy / u_textureSize;
	vec4 resultColor =  GET_PIXEL(-1, -1)*u_kernel[0] +
						GET_PIXEL( 0, -1)*u_kernel[1] +
						GET_PIXEL( 1, -1)*u_kernel[2] +
						GET_PIXEL(-1,  0)*u_kernel[3] +
						GET_PIXEL( 0,  0)*u_kernel[4] +
						GET_PIXEL( 1,  0)*u_kernel[5] +
						GET_PIXEL(-1,  1)*u_kernel[6] +
						GET_PIXEL( 0,  1)*u_kernel[7] +
						GET_PIXEL( 1,  1)*u_kernel[8];
	
   gl_FragColor = vec4(resultColor.rgb, 1.0);
}`;


filters.prototype.conv = function(kernel) {
	var gl = this.gl;
	var program = this.createProgram("conv3x3", shaderSourceMask3x3);
	
	gl.useProgram(program);
	
	var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
	gl.uniform1fv(kernelLocation, kernel);
	
	this.execute(program);
}

})(window.FivekoGFX);
