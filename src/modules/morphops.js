/**
 * Mathematical morphology operators
 * - erosion
 * - dilation
 *
 * Copyright (c) 2017 fiveko.com
 * See the LICENSE file for copying permission.
 */
 
"use strict";

(function(filters) {

const shaderSource = `
precision mediump float;

#define KERNEL_SIZE %kernelSize%
#define KERNEL_HALF KERNEL_SIZE / 2
// our texture
uniform sampler2D u_image;
uniform vec2 u_textureSize;
uniform vec2 u_direction;

#define GET_PIXEL(_p) (texture2D(u_image, textCoord + onePixel*vec2(_p)))
#define CMP  %cmpMethod%

void main() {
	vec2 onePixel = u_direction / u_textureSize;
	vec2 textCoord = gl_FragCoord.xy / u_textureSize;
	vec4 resultColor = GET_PIXEL(0);
	for (int i = -KERNEL_HALF; i <= KERNEL_HALF; i++){
		resultColor = CMP(resultColor, GET_PIXEL(i));
	}
	gl_FragColor = vec4(resultColor.rgb, 1.0);
}`;


function execute(name, size, method){
	var gl = this.gl;
	var program = this.createProgram(name + size, 
									shaderSource.replace(/%kernelSize%/g, size).
									replace(/%cmpMethod%/g, method));
	gl.useProgram(program);
	// Execute separable operator - rows and cols
	var directionLocation = gl.getUniformLocation(program, "u_direction");
	gl.uniform2fv(directionLocation, [0, 1]);
	this.execute(program);
	gl.uniform2fv(directionLocation, [1, 0]);
	this.execute(program);
}


filters.prototype.erosion = function(size) {
	return execute.call(this, "erosion", size || 3, "min");
}

filters.prototype.dilation = function(size) {
	return execute.call(this, "dilation", size || 3, "max");
}

})(window.FivekoGFX);
