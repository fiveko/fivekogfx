/**
 * Gaussin filters
 * This module depends on conv.js
 *
 * Copyright (c) 2017 fiveko.com
 * See the LICENSE file for copying permission.
 */
 
"use strict";

(function(filters) {

const GAUSSKERN_MAX = 15; // Make sure it is uneven

function makeKernel(sigma){
	const dim = GAUSSKERN_MAX + !(GAUSSKERN_MAX & 1);
	const sqrtSigmaPi2 = Math.sqrt(Math.PI*2.0)*sigma;
	const s2 = 2.0*sigma * sigma;
	var i, j, c = parseInt(dim / 2);
	var kernel = new Float32Array(dim); // make kernel size equal to GAUSSKERN_MAX (WebGL Shader)
	for (j = 0, i = -c; j < dim; i++, j++) 
	{
		kernel[j] = Math.exp(-(i*i)/(s2)) / sqrtSigmaPi2;
	}

	return kernel;
}


filters.prototype.gauss = function(sigma) {
	if (sigma > 0){
		var params = this.params["gauss"];
		if (!params || params.sigma !== sigma){
			params = {sigma: sigma, kernel: makeKernel(sigma)};
			this.params["gauss"] = params;
		}
		// Execute separable convolution using Gaussian kernel
		// The conv1d performs internal normalization
		this.conv1d(params.kernel);
	}
}


})(window.FivekoGFX);
