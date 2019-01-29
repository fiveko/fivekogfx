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

	var image = new Image;
	var canvas = document.createElement('canvas');
	preview.insertBefore(canvas, preview.firstChild);
	
	function resizeCanvas(source){
		const maxWidth = 480;
		var maxSize = (document.documentElement.clientWidth > maxWidth ? maxWidth : (document.documentElement.clientWidth - 100));
		var sourceWidth = (source.width || source.videoWidth);
		var sourceHeight = (source.height || source.videoHeight);
		var scale = maxSize / Math.max(sourceWidth, sourceHeight);
		canvas.width = sourceWidth*scale;
		canvas.height = sourceHeight*scale;
	}
	
	function loadVideo(stream, callback){
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
					document.getElementById('cmbFilters').getFilter().update();
				}, 40);
			}
			video = document.createElement('video');
			video.addEventListener('canplaythrough', startVideo, true);
			video.addEventListener('ended', videoDone, true);
			canvas.onclick = function(){
				((video.paused) ? startVideo() : stopVideo());
			};
		}
		// Older browsers may not have srcObject
		try {
			video.srcObject = stream;
		} catch (error) {
			// Avoid using this in new browsers, as it is going away.
			window.URL.revokeObjectURL(video.src);
			video.src = window.URL.createObjectURL(stream);
		}
		
		window.redraw = function(){
			canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
		}
	}
	function loadImage(source, callback){
		image.onload = function() {
			resizeCanvas(this);
			canvas.getContext('2d').drawImage(this, 0, 0, canvas.width, canvas.height);
			callback();
		}
		window.redraw = function(){
			canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
		}
		if (source) {
			if (typeof source === 'string') { // Handle URL source
				image.src = source; 
			} else {  // Handle File
				window.URL.revokeObjectURL(image.src);
				image.src = window.URL.createObjectURL(source);
			}
		} else {
			callback(); 
		}
	}
	
	function handleFiles(e){
		//var url = URL.createObjectURL(e.target.files[0]);
		const file = e.target.files[0];
		var type = file.type;
		var func = (type.substring(0, "image".length) == "image") ? loadImage : 
					(type.substring(0, "video".length) == "video") ? loadVideo : null;
		if (func){
			func(file, function(){
				document.getElementById('cmbFilters').onchange();
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
	
	function createPanel(){
		var panel = document.createElement('div');
		
		panel.innerHTML = '<input type="file" style="display: none;"><button data-role="browse" style="margin: 10px; width: 100px;">Browse</button><button data-role="camera" style="margin: 10px; width: 100px;">Camera</button><select id="cmbFilters"></select>';
		// Hook events to panel controls 
		panel.querySelector('input[type=file]').addEventListener('change', handleFiles);
		panel.querySelector('button[data-role=browse]').addEventListener('click', function(){
			panel.querySelector('input[type=file]').click();
		});
		
		panel.querySelector('button[data-role=camera]').addEventListener('click', function(){
			navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || 
									navigator.mozGetUserMedia || navigator.msGetUserMedia || 
									navigator.oGetUserMedia;
			  if (navigator.getUserMedia) {
				// get webcam feed if available
				navigator.getUserMedia({video: true}, function(stream){
					loadVideo(stream, function(){
						console.log("Camera stream started!");
					});
				}, function(e){
					alert("Failed to initialize camera!");
				});
			}
		});
		
		preview.insertBefore(panel, preview.firstChild);
	}
	
	createPanel();
	
	
	var cmbFilters = document.getElementById('cmbFilters');
	cmbFilters.onchange = function(){
		document.getElementById("controls").innerHTML = "";
		this.getFilter().init();
		//filter.update();
		return false;
	}
	
	// Retrieve the current drop-down filter
	cmbFilters.getFilter = function(){
		return this.options[this.selectedIndex].filter;
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
	window.loadImage = loadImage;
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
	onLoadedGFX();
	
}, true);

function onLoadedGFX(){
	var preview = document.querySelector('div[data-role=preview]');
	if (preview){
		var src = preview.getAttribute("data-source");
		var cbkName = preview.getAttribute("data-callback");
		var canvas = preview.querySelector('canvas');
		window.loadImage(src, function(){
			window[cbkName](canvas, canvas);
			cmbFilters.onchange();
			if (cmbFilters.options.length === 1){
				cmbFilters.style.display = 'none';
			}
		});
	}
}
