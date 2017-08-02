/**
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
#define M_PI 3.1415926535897932384626433832795
#define GET_PIXEL(_x, _y) (texture2D(u_image, textCoord + onePixel*vec2(_x, _y)))
 

void main() {
	vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
	vec2 textCoord = gl_FragCoord.xy / u_textureSize;
	float dx = (length(GET_PIXEL(-1, -1)*u_kernel[0] +
				GET_PIXEL(-1,  0)*u_kernel[1] +
				GET_PIXEL(-1, +1)*u_kernel[2]) -
			   length(GET_PIXEL(+1, -1)*u_kernel[0] +
				GET_PIXEL(+1,  0)*u_kernel[1] +
				GET_PIXEL(+1, +1)*u_kernel[2]));
	float dy = (length(GET_PIXEL(-1, -1)*u_kernel[0] +
				GET_PIXEL(0, -1)*u_kernel[1] +
				GET_PIXEL(+1, -1)*u_kernel[2]) -
			   length(GET_PIXEL(-1, +1)*u_kernel[0] +
				GET_PIXEL(0, +1)*u_kernel[1] +
				GET_PIXEL(+1, +1)*u_kernel[2]));

///gl_FragColor = vec4(vec3(length(vec2(dx, dy))), 1.0);
   float theta = (atan(dy, dx) + M_PI) / (2.0*M_PI);
   gl_FragColor = vec4(length(vec2(dx, dy)), theta, 0.0, 1.0);
}`;

const shaderSourceNMS = `
precision mediump float;

#define KERNEL_SIZE 3
// our texture
uniform sampler2D u_image;
uniform vec2 u_textureSize;
#define M_PI 3.1415926535897932384626433832795

void main() {
	vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
	vec2 textCoord = gl_FragCoord.xy / u_textureSize;
	vec4 cc = texture2D(u_image, textCoord);   
	float theta = degrees(cc.y*M_PI*2.0); 
	int ax = 0, ay = 0; 
	if ((theta >= 337.5) || (theta < 22.5))       { ax = 1; ay = 0; }
	else if ((theta >= 22.5) && (theta < 67.5))   { ax = 1; ay = 1; }
	else if ((theta >= 67.5) && (theta < 112.5))  { ax = 0; ay = 1; }
	else if ((theta >= 112.5) && (theta < 157.5)) { ax =-1; ay = 1; }
	else if ((theta >= 157.5) && (theta < 202.5)) { ax =-1; ay = 0; }
	else if ((theta >=202.5) && (theta < 247.5))  { ax =-1; ay =-1; }
	else if ((theta >=247.5) && (theta < 292.5))  { ax = 0; ay =-1; }
	else if ((theta >= 292.5) && (theta < 337.5)) { ax = 1; ay =-1; }

	vec4 ca = texture2D(u_image, textCoord + onePixel*vec2(ax, ay));
	vec4 cb = texture2D(u_image, textCoord + onePixel*vec2(-ax, -ay));
	gl_FragColor = vec4((((cc.x <= ca.x) || (cc.x < cb.x)) ? vec3(0) : vec3(cc.x)), 1.0);
}`;

function applyNMS(self){
	var gl = self.gl;
	var program = self.createProgram("edgeNMS", shaderSourceNMS);
	
	gl.useProgram(program);
	self.execute(program);
}

function apply(self, kernel){
	var gl = self.gl;
	var program = self.createProgram("sobel", shaderSource);
	
	gl.useProgram(program);
	
	var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
	gl.uniform1fv(kernelLocation, kernel);
	
	self.execute(program);
	applyNMS(self);
}

filters.prototype.sobel = function() {
	apply(this, [1, 2, 1]);
}

filters.prototype.schaar = function() {
	apply(this, [3, 10, 3]);
}

})(window.FivekoGFX);