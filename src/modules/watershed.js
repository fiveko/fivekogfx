/**
 * Copyright (c) 2017 fiveko.com
 * See the LICENSE file for copying permission.
 */
(function(filters) {

"use strict";


var PQueue = function(){
	this.nodes = [];
}

PQueue.prototype.push = function(el, comparator){
	var nodes = this.nodes;
	var offset = 0,
		size = nodes.length;
		
	while (offset < size){
		const pos = ((offset + size) >>> 1);
		const diff = comparator(el, nodes[pos]);
		((diff < 0) ? (offset = pos + 1) : (size = pos));
	}
	
	nodes.splice(offset, 0, el);
}

PQueue.prototype.pop = function(){
	return this.nodes.pop();
}

PQueue.prototype.empty = function(){
	return (this.nodes.length === 0);
}

PQueue.prototype.size = function(){
	return this.nodes.length;
}

// Meyer's flooding algorithm
function meyers(pixels, seeds){
	// Create buffer using pixels.data ctor
	var buff = new pixels.data.constructor(new ArrayBuffer(pixels.data.length));
	var data = pixels.data;
	var queue = new PQueue();
	const dirxy = [-4, 4, -pixels.width*4, pixels.width*4];
	
	function comparator(a, b){
		return (buff[a + 1] - buff[b + 1]);
	}
	
	// https://en.wikipedia.org/wiki/Color_difference
	function diffRGB(p1, p2){
		const rmean = (data[p1 + 0] + data[p2 + 0]) >>> 1;
		const r = (data[p1 + 0] - data[p2 + 0]),
				g = (data[p1 + 1] - data[p2 + 1]),
				b = (data[p1 + 2] - data[p2 + 2]);
		
		return Math.sqrt((((512+rmean)*r*r)>>8) + 4*g*g + (((767-rmean)*b*b)>>8));
	}
	
	function addPoint(p){
		for (var i = 0; i < 4; i++){
			const pos = p + dirxy[i];
			if (buff[pos] === 0){
				buff[pos] = buff[p];
				buff[pos + 1] = diffRGB(p, pos);
				queue.push(pos, comparator);
			}
		}
	}
	
	const w = pixels.width*4;
	for (var i = 0, h = w*pixels.height; i < w; i+=4){
		buff[i] = buff[i + h] = 255;
	}
	for (var i = 0, h = pixels.height*w; i < h; i+=w){
		buff[i] = buff[i + w - 1] = 255;
	}
	
	for (var i = 0, l = seeds.length; seeds[i]; i++){
		var p = seeds[i].pixels;
		for (var j = 0, c = p.length; j < c; j++){
			buff[p[j]] = (i + 1)*80;
			addPoint(p[j]);
		}
	}
	while (!queue.empty()){
		var el = queue.pop();
		addPoint(el);
	}
	
	for (var i = w + 4, l = w*pixels.height - w; i < l; i+=4){
		if (buff[i] == 2*80){
			data[i + 1] = data[i + 2] = dirxy.reduce(function(acc, off) { return acc | (buff[i]^buff[i+off]); }, 0)*255;
		}
	}
}

filters.prototype.watershed = function(canvas, seeds) {
	var context = canvas.getContext('2d');
	var pixels = context.getImageData(0,0,canvas.width,canvas.height);
	meyers(pixels, seeds);
	context.putImageData(pixels, 0, 0);
}

})(window.FivekoGFX);
