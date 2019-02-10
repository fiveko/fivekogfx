/**
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
#define KERNEL_SIZE %kernelSize%
#define HALF_SIZE (KERNEL_SIZE / 2)

void main() {
	vec2 textCoord = gl_FragCoord.xy / u_textureSize;
	vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
	vec4 meanColor = vec4(0);
	vec4 v = texture2D(u_image, textCoord);
	for (int y = 0; y <= HALF_SIZE; y++){
		for (int x = -HALF_SIZE; x <= HALF_SIZE; x++){
			vec4 v1 = texture2D(u_image, textCoord + vec2(x, y) * onePixel);  
			vec4 v2 = texture2D(u_image, textCoord - vec2(x, y) * onePixel);
			vec4 d1 = abs(v - v1);
			vec4 d2 = abs(v - v2);
			vec4 rv = vec4( ((d1[0] < d2[0]) ? v1[0] : v2[0]),
							((d1[1] < d2[1]) ? v1[1] : v2[1]),
							((d1[2] < d2[2]) ? v1[2] : v2[2]), v.a);
			meanColor += rv;
		}
	}
	gl_FragColor = meanColor / float(KERNEL_SIZE*(HALF_SIZE + 1));
}`;


filters.prototype.symmetricnn = function(size, count) {
	var params = this.params["symmetricnn"];
	size += !(size & 1); // Make the size odd
	if (params && params.size !== size){
		this.deleteProgram("symmetricnn");
	}
	this.params["symmetricnn"] = {size: size};
	var gl = this.gl;
	var program = this.createProgram("symmetricnn", shaderSource.replace(/%kernelSize%/g, size));
	gl.useProgram(program);
	
	for (var i =0; i < count; i++)
	{
		this.execute(program);
	}
}


})(window.FivekoGFX);
