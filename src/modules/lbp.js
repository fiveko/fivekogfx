/**
 * Local Binary Patterns
 * - lbp
 *
 * Copyright (c) 2017 fiveko.com
 * See the LICENSE file for copying permission.
 */
 
"use strict";

(function(filters) {

const shaderSource = `
precision mediump float;

// our texture
uniform sampler2D u_image;
uniform vec2 u_textureSize;
#define GET_PIXEL(_x, _y) (texture2D(u_image, textCoord + onePixel*vec2(_x, _y)))
#define CMP(_x, _y) vec4(greaterThanEqual((_x), (_y)))

void main() {
	vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
	vec2 textCoord = gl_FragCoord.xy / u_textureSize;
	vec4 color = GET_PIXEL(0, 0);
	vec4 value = CMP(color, GET_PIXEL(-1, -1))*0.5 +
				 CMP(color, GET_PIXEL(-1,  0))*0.25 +
				 CMP(color, GET_PIXEL(-1,  1))*0.125 +
				 CMP(color, GET_PIXEL( 0,  1))*0.0625 +
				 CMP(color, GET_PIXEL( 1,  1))*0.03125 +
				 CMP(color, GET_PIXEL( 1,  0))*0.015625 +
				 CMP(color, GET_PIXEL( 1, -1))*0.0078125 +
				 CMP(color, GET_PIXEL( 0, -1))*0.00390625;

	gl_FragColor = vec4(value.rgb, 1.0);
}`;


function apply(self){
	var gl = self.gl;
	var program = self.createProgram("lbp", shaderSource);
	
	gl.useProgram(program);
	self.execute(program);
}

filters.prototype.lbp = function() {
	apply(this);
}

})(window.FivekoGFX);
