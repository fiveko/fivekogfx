/*!
 * @file fivekogfx.js
 * @brief Fiveko Graphics library 
 * The FivekoGFX library is based on OpenGL/WebGL and HTML5 technolgies
 *
 * @defgroup FivekoGFX Fiveko Graphics
 *
 * Copyright (c) 2017 fiveko.com
 * See the LICENSE file for copying permission.
 */

"use strict";
/**
\cond HIDDEN_SYMBOLS
*/
function FivekoGFX(canvasSource){
	
	function getWebGLContext(canvas){
		try {
			return (canvas.getContext("webgl", {premultipliedAlpha: false}) || canvas.getContext("experimental-webgl", {premultipliedAlpha: false}));
		}
		catch(e) {
			console.log("ERROR: %o", e);
		}
		return null;
	}
	
	function readTextFile(file, callback)
	{
		var rawFile = new XMLHttpRequest();
		rawFile.open("GET", file, false);
		rawFile.onreadystatechange = function ()
		{
			if ((rawFile.readyState === 4) && 
				(rawFile.status === 200 || rawFile.status == 0))
			{
				callback(rawFile.responseText);
			}
			return callback("");
		}
		rawFile.send(null);
	}
	
	function createTexture(gl){
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		// Flip the image's Y axis to match the WebGL texture coordinate space.
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		
		// Set the parameters so we can render any size image.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		return texture;
	}
	
	var fivekogfx = this;
	fivekogfx.gl = (canvasSource) ? getWebGLContext(canvasSource) : getWebGLContext(document.createElement('canvas'));
	
	fivekogfx.params = {};
	fivekogfx.programs = {};
	fivekogfx.sources = {};
	
	FivekoGFX.prototype.createProgram = function(name, fragmentSource, vertexSource){
		var gl = this.gl,
			shaderProgram = this.programs[name];
		
		if (shaderProgram){
			gl.useProgram(shaderProgram);
			return shaderProgram;
		}
		
		function createShader(type, source){
			var shader = gl.createShader(type); // gl.FRAGMENT_SHADER or gl.VERTEX_SHADER
			
			gl.shaderSource(shader, source);

			// Compile the shader program
			gl.compileShader(shader);  

			// See if it compiled successfully
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {  
				alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));  
				return null;  
			}
			
			return shader;
		}
		
		var vertexShader, fragmentShader;
		
		if (!vertexSource){
			vertexShader = createShader(gl.VERTEX_SHADER,   `attribute vec2 a_position;
															void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`
															);
		} else {
			vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
		}
		fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);
		
		shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);

		// If creating the shader program failed, alert
		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			alert("Unable to initialize the shader program.");
		} else {
			this.programs[name] = shaderProgram;
		}
		
		gl.useProgram(shaderProgram);
		return shaderProgram;
	}
	
	FivekoGFX.prototype.createProgramFromFile = function(name, fragmentSource, vertexSource, callback){
		readTextFile(fragmentSource, function(code){
			if (code !== ""){
				var shaderProgram = createProgram(name, code);
				callback(shaderProgram);
			} else {
				callback(null);
			}
		});
	}
	
	FivekoGFX.prototype.deleteProgram = function(name){
		var gl = this.gl,
			shaderProgram = this.programs[name];
		
		if (shaderProgram){
			gl.deleteProgram(shaderProgram);
			this.programs[name] = null;
		}
	}
	
	FivekoGFX.prototype.initialize = function(width, height){
		var fivekogfx = this;
		var gl = fivekogfx.gl;
		var canvas = gl.canvas;
		
		// If we are using the same dimensions then just return
		if (this.originalImageTexture && canvas.width == width && canvas.height == height){
			return;
		}
		
		canvas.width = width;
		canvas.height = height;
		if (this.originalImageTexture){
			for (var i = 0; i < this.textures.length; i++){
				gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 
							canvas.width, canvas.height, 0, 
							gl.RGBA, this.texType, null);
			}
			return;
		}
		
		this.originalImageTexture = createTexture(gl);
		this.texType = ((gl.getExtension('OES_texture_float')) ? gl.FLOAT : gl.UNSIGNED_BYTE);
		
		// create 2 textures and attach them to framebuffers.
		var textures = [];
		var framebuffers = [];
		for (var ii = 0; ii < 2; ++ii) {
			var texture = createTexture(gl);
			textures.push(texture);

			// make the texture the same size as the image
			gl.texImage2D(
				gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0,
				gl.RGBA, this.texType, null);

			// Create a framebuffer
			var fbo = gl.createFramebuffer();
			framebuffers.push(fbo);
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

			// Attach a texture to it.
			gl.framebufferTexture2D(
				gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
		}
		
		// provide texture coordinates for the rectangle.
		var positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		  -1.0, -1.0, 
		   1.0, -1.0, 
		  -1.0,  1.0, 
		  -1.0,  1.0, 
		   1.0, -1.0, 
		   1.0,  1.0]), gl.STATIC_DRAW);
		
		fivekogfx.textures = textures;
		fivekogfx.framebuffers = framebuffers;
		fivekogfx.count = 0;
	}
	
	FivekoGFX.prototype.load = function(source){
		var fivekogfx = this;
		var gl = fivekogfx.gl;
		
		this.initialize(source.width, source.height);
		
		// start with the original image
		var startTime = window.performance.now();
		gl.bindTexture(gl.TEXTURE_2D, this.originalImageTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
		console.log("Image loaded!" + "Elapsed: " + (window.performance.now() - startTime).toString());
	}
	
	function render(gl, program, fbo){
		// look up where the vertex data needs to go.
		var positionLocation = gl.getAttribLocation(program, "a_position"); 

		// look up uniform locations
		var u_imageLoc = gl.getUniformLocation(program, "u_image");
		var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
		
		//var startTime = window.performance.now();
		//gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(positionLocation);
		
		var width = gl.canvas.width,
			height = gl.canvas.height;
		
		// make this the framebuffer we are rendering to.
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

		// Tell the shader the resolution of the framebuffer.
		gl.uniform2f(textureSizeLocation, width, height);
		
		gl.uniform1i(u_imageLoc, 0);
		
		// Tell webgl the viewport setting needed for framebuffer.
		gl.viewport(0, 0, width, height);
		
		// Draw the rectangle.
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		// for the next draw, use the texture we just rendered to.
		//gl.bindTexture(gl.TEXTURE_2D, texture);
		
	}
	FivekoGFX.prototype.renderto = function(program, fbo){
		render(this.gl, program, fbo);
	}
	
	FivekoGFX.prototype.draw = function(canvas){
		var gl = this.gl;
		var program = this.createProgram("draw", `precision mediump float;
													uniform sampler2D u_image;
													uniform vec2 u_textureSize;
													void main() {
														vec2 textCoord = gl_FragCoord.xy / u_textureSize;
														gl_FragColor = texture2D(u_image, textCoord);
													}`);
		
		render(gl, program, null);
		this.count = 0;
		
		if (canvas){
			canvas.getContext("2d").drawImage(gl.canvas, 0, 0);
		}
	}
	
	FivekoGFX.prototype.makeTextImage2D = function(program, id, name, width, height, format, type, pixels){
		var gl = this.gl;
		var texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0 + id);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, type, pixels);
		var u_textureLoc = gl.getUniformLocation(program, name);
		gl.uniform1i(u_textureLoc, id);
		// restore back the active TEXTURE0
		gl.activeTexture(gl.TEXTURE0);
	}
	
	FivekoGFX.prototype.readPixels = function(pixels){
		var gl = this.gl;
		
		if (!pixels){
			pixels = {data: new Uint8Array(gl.canvas.width*gl.canvas.height*4), width: gl.canvas.width, height: gl.canvas.height};
		}
		gl.readPixels(0, 0, gl.canvas.width, gl.canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels.data);
		
		return pixels;
	}
	
	FivekoGFX.prototype.getImageData = function(x, y, width, height){
		var gl = this.gl;
		var data = new Float32Array(width*height*4);
		gl.readPixels(x, gl.drawingBufferHeight - y - height, width, height, gl.RGBA, gl.FLOAT, data);
		return {data: data, width: width, height: height};
	}
	
	FivekoGFX.prototype.execute = function(program){
		var fivekogfx = this;
		var gl = fivekogfx.gl;
		render(gl, program, this.framebuffers[this.count % 2]);
		// for the next draw, use the texture we just rendered to.
		gl.bindTexture(gl.TEXTURE_2D, this.textures[this.count % 2]);

		// increment count so we use the other texture next time.
		++this.count;
	}
}

FivekoGFX.params = {};
FivekoGFX.sources = {};
FivekoGFX.sourceText = function(name, credits){
	return FivekoGFX.sources[name];
}

FivekoGFX.prototype.loadShaders = function(shaders){
	var fivekogfx = this;
	var gl = fivekogfx.gl;
	
	
	function getShader(gl, id) {
		var shaderScript = document.getElementById(id);

		if (!shaderScript) {
			return null;
		}

		var theSource = "", 
		currentChild = shaderScript.firstChild,
		shader;
		console.log(gl);
		while(currentChild) {
			if (currentChild.nodeType == currentChild.TEXT_NODE) {
				theSource += currentChild.textContent;
			}
			currentChild = currentChild.nextSibling;
		}
		if (shaderScript.type == "x-shader/x-fragment") {
			shader = gl.createShader(gl.FRAGMENT_SHADER);
		} else if (shaderScript.type == "x-shader/x-vertex") {
			shader = gl.createShader(gl.VERTEX_SHADER);
		} else {
			// Unknown shader type
			return null;
		}
		gl.shaderSource(shader, theSource);

		// Compile the shader program
		gl.compileShader(shader);  

		// See if it compiled successfully
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {  
			alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));  
			return null;  
		}

		return shader;
	}
	
	var fragmentShader = getShader(gl, shaders[0]/*"2d-vertex-shader"*/);
	var vertexShader = getShader(gl, shaders[1]/*"2d-fragment-shader"*/);

	// Create the shader program

	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Unable to initialize the shader program.");
	}

	return shaderProgram;
}
/**
 \endcond
*/