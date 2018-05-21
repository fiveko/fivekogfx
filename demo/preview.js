/*!
 *
 * Created by FIVEKO.com 2017
 * 
 * The source code is designed and developed for educational purposes only. 
 * It is designed for no other purpose and neither the authors nor their institutions 
 * accept any liability concerning its use.
 * 
 */
 
"use strict";

window.addEventListener('load', function(e) {
	var preview = document.querySelector('div[data-role=preview]');
	if (!preview)
		return;

	var gFilter = null;
	var image = new Image;
	var gSource = image;
	var canvas = document.createElement('canvas');
	//canvas.display = "inline";
	
	function addCss(cssCode) {
	var styleElement = document.createElement("style");
	  styleElement.type = "text/css";
	  if (styleElement.styleSheet) {
		styleElement.styleSheet.cssText = cssCode;
	  } else {
		styleElement.appendChild(document.createTextNode(cssCode));
	  }
	  document.getElementsByTagName("head")[0].appendChild(styleElement);
	}

	function resizeCanvas(source){
		const maxWidth = 480;
		var maxSize = (document.documentElement.clientWidth > maxWidth ? maxWidth : (document.documentElement.clientWidth - 100));
		var sourceWidth = (source.width || source.videoWidth);
		var sourceHeight = (source.height || source.videoHeight);
		var scale = maxSize / Math.max(sourceWidth, sourceHeight);
		canvas.width = sourceWidth*scale;
		canvas.height = sourceHeight*scale;
	}
	
	function loadVideo(url, callback){
		var video = document.getElementsByTagName('video')[0];
		if (!video){
			var intervalID;
			function videoDone(){
				clearInterval(intervalID);
			}
			function stopVideo(){
				video.pause();
				clearInterval(intervalID);
			}
			function startVideo(){
				video.play();
				video.muted = true;
				resizeCanvas(video);
				clearInterval(intervalID);
				intervalID = setInterval(function(){
					gFilter.update();
				}, 30);
			}
			video = document.createElement('video');
			video.addEventListener('canplaythrough', startVideo, true);
			video.addEventListener('ended', videoDone, true);
			canvas.onclick = function(){
				((video.paused /*&& gSource == video*/) ? startVideo() : stopVideo());
			};
		}
		gSource = video;
		video.src = url;
		//video.autoPlay = true;
		
		
	}
	function loadImage(url, callback){
		image.onload = function() {
			resizeCanvas(image);
			canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
			callback();
		}
		if (url) { image.src = url; } else { callback(); }
		gSource = image;
	}
	
	function handleFiles(e){
		var url = URL.createObjectURL(e.target.files[0]);
		var type = e.target.files[0].type;
		var func = (type.substring(0, "image".length) == "image") ? loadImage : 
					(type.substring(0, "video".length) == "video") ? loadVideo : null;
		if (func){
			func(url, function(){
				URL.revokeObjectURL(url);
			});
		}
	}
	
	function addcss(css){
		var head = document.getElementsByTagName('head')[0];
		var s = document.createElement('style');
		s.setAttribute('type', 'text/css');
		if (s.styleSheet) {   // IE
			s.styleSheet.cssText = css;
		} else {                // the world
			s.appendChild(document.createTextNode(css));
		}
		head.appendChild(s);
	}
	
	addcss(".input-group-addon.title{min-width:120px;}.input-group-addon.value{width:60px;}");
	
	var panel = document.createElement('div');
	var inputFile = document.createElement('input');
	var cmdUpload = document.createElement('button');
	//var cmdDownload = document.createElement('button');
	var cmdWebCam = document.createElement('button');
	var cmbFilters = document.createElement('select');
	inputFile.setAttribute("type", "file");
	inputFile.style.display = 'none';
	inputFile.addEventListener('change', handleFiles);
	//cmdDownload.textContent = "Download";
	cmdWebCam.textContent = "Camera";
	cmdWebCam.style.margin = "10px";
	cmdWebCam.style.width = "100px";
	cmdUpload.textContent = "Browse";
	cmdUpload.style.margin = "10px";
	cmdUpload.style.width = "100px";
	//
	cmdUpload.onclick = function(){
		inputFile.click();
		//alert("TEST");
		return false;
	}
	/*cmdDownload.onclick = function(){
		downloadImage();
		return false;
	}*/
	
	cmdWebCam.onclick = function(){
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || 
								navigator.mozGetUserMedia || navigator.msGetUserMedia || 
								navigator.oGetUserMedia;
		  if (navigator.getUserMedia) {
			// get webcam feed if available
			navigator.getUserMedia({video: true}, function(stream){
				var url = window.URL.createObjectURL(stream);
				loadVideo(url, function(){
					URL.revokeObjectURL(url);
				});
			}, function(e){
				alert("Failed to initialize camera!");
			});
		  }
	}
	
	cmbFilters.onchange = function(){
		document.getElementById("controls").innerHTML = "";
		var filter = this.options[this.selectedIndex].filter;
		gFilter = this.options[this.selectedIndex].filter;
		filter.init();
		//filter.update();
		return false;
	}
	
	
	preview.insertBefore(canvas, preview.firstChild);
	preview.insertBefore(panel, preview.firstChild);
	panel.appendChild(inputFile);
	panel.appendChild(cmdUpload);
	panel.appendChild(cmdWebCam);
	panel.appendChild(cmbFilters);

		
	window.reloadImage = function(){
		var ctx = canvas.getContext('2d');
		ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
	}
	
	window.redraw = function(){
		canvas.getContext('2d').drawImage(gSource/*image*/, 0, 0, canvas.width, canvas.height);
	}
	
	function Filter(name, init, update, reset) {
		this.controls = [];
		this.name = name;
		this.init = function (){
			this.controls = [];
			init.call(this);
			this.update.call(this);
		}
		this.update = function (){
			var startTime = new Date();
			reset.call(this);
			var values = [];
			for (var i = 0; i < this.controls.length; i++)
				values.push(this.controls[i].value);
				
			update.apply(this, values);
			var endTime = new Date();
			document.getElementById('log').innerText = 'Elapsed: ' + (endTime - startTime) + ' ms';
		}
		this.reset = reset;
		//init.call(this);
	}
	Filter.prototype.add = function(el){
		this.controls.push(el);
	}
	
	function addFilter(filter){
		var option = document.createElement("option");
		option.text = filter.name;
		option.filter = filter;
		cmbFilters.add(option);
	}
	window.selectFilter = function(txtFilter){
		cmbFilters.style.display = 'none';
		for (var i = 0; i < cmbFilters.options.length; i++) {
			if (cmbFilters.options[i].text === txtFilter) {
				cmbFilters.selectedIndex = i;
				break;
			}
		}
	}
	window.addFilter = addFilter;
	window.Filter = Filter;
	window.createSlider = function(container, name, title, value, min, max, step, callback){
		var holder = document.createElement('div');
		var txtTemplate = '<div class="input-group" style="max-width:420px; margin:auto;">' +
						'<span class="input-group-addon title">' + title + '</span>' +
						'<input type="range" class="form-control" id="' + name + '" >' +
						'<span class="input-group-addon value">' + value + '</span>' +
						'</div>';
		holder.innerHTML = txtTemplate;
		container.appendChild(holder);
		
		var el = document.getElementById(name);
		el.min = min;
		el.max = max;
		el.step = step;
		el.value = value;
		el.oninput = el.onchange = function(e){ el.nextSibling.innerText = this.value; }
		el.onmouseup = el.ontouchend = callback;
		return el;
	}
	
	window.createButton = function(container, name, title, callback){
		var cmd = document.createElement('button');
		cmd.addClass = "btn btn-primary";
		cmd.innerText = title;
		cmd.name = name;
		cmd.onclick = callback;
		container.appendChild(cmd);
		return cmd;
	}
	
	window.createSelector = function(canvas, callback){
		var rect = {x: 0, y: 0, w: 0, h: 0};
		var el = {canvas: canvas, value: null};
		canvas.onmousedown = function(e){
			rect.x = e.offsetX;
			rect.y = e.offsetY;
		}
		canvas.onmousemove = function(e){
			if (!e.buttons)
				return;
			
			rect.w = e.offsetX - rect.x;
			rect.h = e.offsetY - rect.y;
			var ctx = canvas.getContext("2d");
			// clear canvas
			redraw();
			ctx.beginPath();
			ctx.rect(rect.x, rect.y, rect.w, rect.h);
			ctx.stroke();
		}
		
		canvas.onmouseup = function(e){
			callback(rect);
		};
		return el;
	}
	
	// Finalize
	{
		var src = preview.getAttribute("data-source");
		var cbkName = preview.getAttribute("data-callback");
		//var loadImage = ((preview.getAttribute('data-type') == 'webgl') ? loadImage2d/*loadImageWebGL*/ : loadImage2d);
		
		loadImage(src, function(){
			window[cbkName](canvas, canvas);
			cmbFilters.onchange();
			if (cmbFilters.options.length === 1){
				cmbFilters.style.display = 'none';
			}
		});
		
	}
	
}, true);