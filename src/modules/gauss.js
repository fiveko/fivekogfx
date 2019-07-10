/**
* @file gauss.js
* @brief Gaussian smooth filters
* This module depends on conv.js
*
* @ingroup SpatialFilters
*
* @section intro_sec External resources
* @li <a href="http://fiveko.com/tutorials/image-processing/gaussian-blur-filter/">Gaussian Blur Tutorial</a> 
* 
* \copyright
* Copyright (c) 2017-2019 fiveko.com .
* See the LICENSE file for copying permission.
*/

/**
* @defgroup SpatialFilters Spatial Filters
* @{
*     Spatial image filtering is an image processing technique that performs directly on the pixels.
*     The process consists of a moving mask over each image pixel in order to execute desired filtering process.
      @li Linear filtering
      @li Non-Linear filtering
      @li Smoothing linear filtering
      @li Order-Statistics filtering
*
* @}
* @ingroup FivekoGFX
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

/**
 * Gaussian blur filter (Gaussian smoothing)
 * @ingroup SpatialFilters
 * @param {float} sigma - standart deviation
 *
 * @par Overview
 * The Gaussian filter is a low-pass filter that reduce image noise and leads to blurry looking effect.
 * This method uses conv1d to perform separable Gaussina convolution
 * @par Math theory
 * @li Gaussian convolution with one dimensional kernel:
 * \f$\displaystyle{G}{\left({x}\right)}=\frac{1}{\sqrt{{{2}\pi\sigma^{2}}}}{e}^{{-\frac{{x}^{2}}{{{2}\sigma^{2}}}}}\f$
 * @li Gaussian convolution with 2-D kernel:
 * \f$\displaystyle{G}{\left({x}\right)}=\frac{1}{{{2}\pi\sigma^{2}}}{e}^{{-\frac{{{x}^{2}+{y}^{2}}}{{{2}\sigma^{2}}}}}\f$
 * 
 * @par Example code
 * @code{.cpp}
  var fivekogfx = new FivekoGFX();
  fivekogfx.load(canvas);
  fivekogfx.gauss(2.0); // e.g. Sigma=2.0
  fivekogfx.draw(canvas);
 * @endcode
 * @par Example image result
 * @image html gauss_ex.jpg "Gaussian blur example image with stddev=6.0"
 * @par External resources
 * @li <a href="http://fiveko.com/tutorials/image-processing/gaussian-blur-filter/">Gaussian Blur Tutorial</a> 
 * 
 * @see conv1d mean
*/
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
