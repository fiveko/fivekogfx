/**
 * Generic Non-Maximum suppression
 *
 * Copyright (c) 2017 fiveko.com
 * See the LICENSE file for copying permission.
 */
 
"use strict";

(function(filters) {

const shaderSource = `
precision mediump float;

#define KERNEL_SIZE %kernelSize%

// our texture
uniform sampler2D u_image;
uniform vec2 u_textureSize;
uniform vec2 u_direction;

#define GET_PIXEL(_p) (texture2D(u_image, textCoord + onePixel*float(_p)))
 

void main() {
	vec2 onePixel = u_direction / u_textureSize;
	vec2 textCoord = gl_FragCoord.xy / u_textureSize;
	
	if (any(lessThan(GET_PIXEL(0).rgb, vec3(0.0))))
	{
		gl_FragColor = vec4(vec3(0.0), 1.0);
	}
	else
	{
		int maxIdx;
		float maxValue = 0.0;
		
		for (int i = -KERNEL_SIZE; i <= KERNEL_SIZE; i++)
		{
			float p = length(GET_PIXEL(i).rgb);
			if (p > maxValue)
			{
				maxValue = p;
				maxIdx = i;
			}
		}
		gl_FragColor = vec4(vec3(maxValue*(1.0 - float(maxIdx != 0)*2.0)), 1.0);
	}
}`;


filters.prototype.nms = function(size) {
	const kernelSize = parseInt(size || 3) + !(size & 1); // Make it odd if not
	var gl = this.gl;
	var program = this.createProgram("nms_size_" + kernelSize, 
				shaderSource.replace(/%kernelSize%/g, kernelSize));
	
	gl.useProgram(program);
	var directionLocation = gl.getUniformLocation(program, "u_direction");
	// Split rows and cols
	gl.uniform2fv(directionLocation, [1, 0]);
	this.execute(program);
	gl.uniform2fv(directionLocation, [0, 1]);
	this.execute(program);
}

})(window.FivekoGFX);
