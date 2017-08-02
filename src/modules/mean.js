/**
 * Copyright (c) 2017 fiveko.com
 * See the LICENSE file for copying permission.
 */
 
"use strict";

(function(filters) {
/* 3x3 Mean Fragment Shader code */
const shaderSoruce = `
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

filters.sources["mean"] = shaderSoruce;

filters.prototype.mean = function() {
	var gl = this.gl;
	var program = this.createProgram("mean", shaderSoruce);
	
	gl.useProgram(program);
	this.execute(program);
}

// Iterative blur using mean filter 
// iterations count is calculated using sigma param
filters.prototype.blur = function(sigma) {
	var count = (12*sigma*sigma) / (3*3-1);
	var gl = this.gl;
	var program = this.createProgram("mean", shaderSoruce);
	
	gl.useProgram(program);
	for (var i = 0; i < count; i++){
		this.execute(program);
	}
}

})(window.FivekoGFX);
