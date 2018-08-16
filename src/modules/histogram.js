/**
 * Copyright (c) 2017 fiveko.com
 * See the LICENSE file for copying permission.
 */
 
"use strict";

(function(filters) {


// Create histogram for defined RECT
// The result is 3 channel hists array with size 256 each
filters.prototype.histogram = function(rect){
	var data = this.getImageData(rect.x, rect.y, rect.w, rect.h).data;
	var hists = Array.from({ length: 3 }, () => new Uint32Array(256));
	for (var i = 0, len = data.length; i < len; i+=4){
		hists[0][~~(data[i + 0]*255)]++;
		hists[1][~~(data[i + 1]*255)]++;
		hists[2][~~(data[i + 2]*255)]++;
	}
	return hists;
}

// Perform CDF Histogram equlization
// h - single channel array
// Retval - Uint8Array in range from 0-255
filters.prototype.equalize = function(h){
	var minVal = 0, maxVal = 0,
	tmp = h.map(function(x) {
		maxVal += x;
		minVal = minVal || maxVal;
		return maxVal;
	});
	var eq = Uint8Array.from(tmp, x => ((x > 0) ? (255*(x - minVal)/(maxVal - minVal)) : 0));
	return eq;
}

// Perform MIN/MAX Histogram normalization
// h - single channel array
// Retval - Uint8Array in range from 0-255
filters.prototype.normalize = function(h){
	const minVal = Math.min.apply(null, h),
		maxVal = (Math.max.apply(null, h) - minVal) || 1,
		result = Uint8Array.from(h, x => (255*(x - minVal)/maxVal));
		
	return result;
}

})(window.FivekoGFX);
