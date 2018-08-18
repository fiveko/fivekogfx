/**
 * Harris Corners Detector
 *
 * Copyright (c) 2017 fiveko.com
 * See the LICENSE file for copying permission.
 */
 
"use strict";

(function(filters) {

const shaderSource = `
precision mediump float;

#define KERNEL_SIZE 3
// our texture
uniform sampler2D u_image;
uniform vec2 u_textureSize;
uniform float u_kernel[KERNEL_SIZE];
uniform int u_direction;

#define GET_PIXEL(_x, _y) (texture2D(u_image, textCoord + onePixel*vec2(_x, _y)))

#define DET(_p)     ((_p).x*(_p).y - (_p).z*(_p).z)
#define TRACE(_p)   ((_p).x + (_p).y)
// Choose desired Harris method (0 or 1)
#define USED_METHOD 1

void main() {
	vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
	vec2 textCoord = gl_FragCoord.xy / u_textureSize;
	
	if (u_direction == 0){
		float dx = length((GET_PIXEL(-1, -1)*u_kernel[0] +
					GET_PIXEL(-1,  0)*u_kernel[1] +
					GET_PIXEL(-1, +1)*u_kernel[2]) -
				   (GET_PIXEL(+1, -1)*u_kernel[0] +
					GET_PIXEL(+1,  0)*u_kernel[1] +
					GET_PIXEL(+1, +1)*u_kernel[2]));
		float dy = length((GET_PIXEL(-1, -1)*u_kernel[0] +
					GET_PIXEL(0, -1)*u_kernel[1] +
					GET_PIXEL(+1, -1)*u_kernel[2]) -
				   (GET_PIXEL(-1, +1)*u_kernel[0] +
					GET_PIXEL(0, +1)*u_kernel[1] +
					GET_PIXEL(+1, +1)*u_kernel[2]));
		
		gl_FragColor = vec4(dx*dx, dy*dy, dx*dy, 1.0);
	}
	else
	{
		vec4 p = (GET_PIXEL(0, 0) + GET_PIXEL(-1, -1) +
				GET_PIXEL(-1,  0) + GET_PIXEL(-1,  1) +
				GET_PIXEL( 0,  1) + GET_PIXEL( 1,  1) +
				GET_PIXEL( 1,  0) + GET_PIXEL( 1, -1) +
				GET_PIXEL( 0, -1)) / 9.0;
	
#if (USED_METHOD == 0)
		float k = 0.04;
		float R = DET(p) - (k * (TRACE(p)*TRACE(p)));
#else  // Harris-Noble corner measure
		float R = DET(p) / (TRACE(p) + 1e-31);
#endif
		gl_FragColor = vec4(vec3(max(R, 0.0)), 1.0);
	}
}`;


filters.prototype.harrisCorners = function() {
	var gl = this.gl;
	var program = this.createProgram("harris", shaderSource);
	
	gl.useProgram(program);
	
	var directionLocation = gl.getUniformLocation(program, "u_direction");
	var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
	gl.uniform1fv(kernelLocation, [1, 2, 1]);
	
	gl.uniform1i(directionLocation, 0);
	this.execute(program);
	gl.uniform1i(directionLocation, 1);
	this.execute(program);
}


})(window.FivekoGFX);
