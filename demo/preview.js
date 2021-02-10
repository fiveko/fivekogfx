/*!
 *
 * Created by FIVEKO.com 2017
 * 
 * The source code is designed and developed for educational purposes only. 
 * It is designed for no other purpose and neither the authors nor their institutions 
 * accept any liability concerning its use.
 * 
 */
 
(function () {
	"use strict";

	function Filter(name, init, update, reset) {
		this.controls = [];
		this.name = name;
		this.init = function (){
			this.controls = [];
			init.call(this);
			this.update.call(this);
		};
		this.update = function (){
			var startTime = new Date();
			reset.call(this);
			var values = [];
			for (var i = 0; i < this.controls.length; i++){
				var value = this.controls[i].value;
				values.push((typeof value === 'string') ? parseFloat(value) : value);
			}
			update.apply(this, values);
			var endTime = new Date();
			document.getElementById('log').innerText = 'Elapsed: ' + (endTime - startTime) + ' ms';
		};
		this.add = function(el){
			this.controls.push(el);
		};
		this.getValue = function(name){
			var el = this.controls.find(el => (el.id === name));
			return ((el.type !== 'checkbox') ? el.vlaue : el.checked);
		};

		this.reset = reset;
		//init.call(this);
	}

	var FivekoFilters = {
		filters: new Map(),
		//callback: null,
		cmbFilters: null,
		Filter: Filter,
		create: function(callback){
			var cmbFilters = document.getElementById("cmbFilters");
			FivekoFilters.cmbFilters = cmbFilters;
			//FivekoFilters.callback = callback;
			FivekoFilters.cmbFilters.onchange = function(){
				document.getElementById("controls").innerHTML = "";
				var filter = FivekoFilters.filters.get(cmbFilters.value);
				if (filter){
					filter.init();
				}
				return false;
			};
			var canvas = FivekoMedia.canvasElement;
			callback.call(FivekoFilters, canvas, canvas);
			if (cmbFilters.options.length === 1){
				cmbFilters.style.display = 'none';
			}
		},
		select: function(filterName){
			
			cmbFilters.value = filterName;
			if (cmbFilters.selectedIndex < 0){
				cmbFilters.value = "Original";
			}
			cmbFilters.onchange();
			
		},
		update: function(){
			var filter = FivekoFilters.filters.get(cmbFilters.value);
			if (filter){
				filter.update();
			}
		},
		addFilter: function(filter){
			var option = document.createElement("option");
			var key = filter.name.split(" ").join("-");
			var value = filter.name;
			FivekoFilters.filters.set(key, filter);
			// Attach the option to filters drop-down 
			option.text = value;
			option.value = key;
			cmbFilters.add(option);
		},
		createSlider: function(container, name, title, value, min, max, step, callback){
			var holder = document.createElement('div');
			var txtTemplate ='<span class="input-group-prepend input-group-text" style="min-width:120px;">' + title + '</span>' +
							'<input type="range" class="form-control mx-2" id="' + name + '" >' +
							'<span class="input-group-append input-group-text" style="min-width:60px;">' + value + '</span>';
			holder.innerHTML = txtTemplate;
			holder.classList.add("input-group");
			holder.style = "max-width:420px; margin:auto;";
			var el = holder.querySelector("#"+name);
			el.min = min;
			el.max = max;
			el.step = step;
			el.value = value;
			el.oninput = el.onchange = function(e){ el.nextSibling.innerText = this.value; };
			el.onmouseup = el.ontouchend = callback;
			container.appendChild(holder);
			return el;
		},
		createButton: function(container, name, title, callback){
			var cmd = document.createElement('button');
			cmd.innerText = title;
			cmd.name = name;
			cmd.className  = "btn btn-primary m-3";
			//cmd.value = value;
			cmd.onclick = callback;
			container.appendChild(cmd);
			return cmd;
		},
		createCheckbox: function(container, name, title, value, callback){
			var holder = document.createElement('div');
			var txtTemplate ='<span class="input-group-prepend input-group-text" style="min-width:120px;">' + title + '</span>' +
							'<input type="checkbox" class="form-control mx-2" id="' + name + '" >';
			holder.innerHTML = txtTemplate;
			holder.classList.add("input-group");
			holder.style = "max-width:420px; margin:auto;";
			var el = holder.querySelector("#"+name);
			el.checked = value;
			el.onclick = callback;
			container.appendChild(holder);
			return el;
		},
		createDropdown: function(container, name, title, values, callback){
			var holder = document.createElement('div');
			var s = document.createElement('select');
			s.innerText = name;
			s.name = name;
			s.className  = "form-control";
			values.forEach(function(x, index){
				var el = document.createElement('option');
				el.value = index + 1;
				el.innerText = x;
				s.appendChild(el);
			});
			s.onchange = callback;
			holder.insertAdjacentHTML('beforeend', '<span class="input-group-prepend input-group-text" style="min-width:120px;">' + title + '</span>');
			holder.classList.add("input-group");
			holder.style = "max-width:420px; margin:auto;";
			holder.appendChild(s);
			container.appendChild(holder);
			return s;
		},
		createSelector: function(canvas, callback){
			var rect = {x: 0, y: 0, w: 0, h: 0};
			var el = {canvas: canvas, value: null};
			canvas.onmousedown = function(e){
				rect.x = e.offsetX;
				rect.y = e.offsetY;
			};
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
			};
			
			canvas.onmouseup = function(e){
				callback(rect);
			};
			return el;
		},
		redraw: function(){

		}
	};

	var FivekoMedia = {
		videoTimerId: null,
		videoElement: null,
		imageElement: new Image(),
		canvasElement: document.createElement("canvas"),
		resizeCanvas: function(source){
			var canvas = FivekoMedia.canvasElement;
			var maxWidth = 600;
			var maxSize = (document.documentElement.clientWidth > maxWidth ? maxWidth : (document.documentElement.clientWidth - 100));
			var sourceWidth = (source.width || source.videoWidth);
			var sourceHeight = (source.height || source.videoHeight);
			var scale = maxSize / Math.max(sourceWidth, sourceHeight);
			canvas.width = sourceWidth*scale;
			canvas.height = sourceHeight*scale;
		},
		createVideo: function(){
			navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || 
									navigator.mozGetUserMedia || navigator.msGetUserMedia || 
									navigator.oGetUserMedia;
			if (navigator.getUserMedia) {
				// get webcam feed if available
				navigator.getUserMedia({video: true}, function(stream){
					FivekoMedia.loadVideo(stream, function(){
						console.log("Camera stream started!");
					});
				}, function(e){
					alert("Failed to initialize camera!");
				});
			}
		},
		loadVideo: function(stream, callback){
			var canvas = FivekoMedia.canvasElement;
			if (!FivekoMedia.videoElement){
				FivekoMedia.videoElement = document.createElement('video');
				FivekoMedia.videoElement.addEventListener('canplaythrough', FivekoMedia.startVideo, true);
				FivekoMedia.videoElement.addEventListener('ended', FivekoMedia.videoDone, true);
				canvas.onclick = function(){
					((FivekoMedia.videoElement.paused) ? FivekoMedia.startVideo : FivekoMedia.stopVideo)();
				};
			}
			var video = FivekoMedia.videoElement;
			try {
				video.srcObject = stream;
			} catch (error) {
				// Avoid using this in new browsers, as it is going away.
				window.URL.revokeObjectURL(video.src);
				video.src = window.URL.createObjectURL(stream);
			}
			
			window.redraw = function(){
				canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
			};
		},
		startVideo: function(stream){
			
			var video = FivekoMedia.videoElement;
			video.play();
			video.muted = true;
			clearInterval(FivekoMedia.videoTimerId);
			FivekoMedia.resizeCanvas(video);
			FivekoMedia.videoTimerId = setInterval(function(){
				FivekoFilters.update();
				//document.getElementById('cmbFilters').getFilter().update();
			}, 30);
		},
		stopVideo: function(){
			var video = FivekoMedia.videoElement;
			if (video){
				video.pause();
				clearInterval(FivekoMedia.videoTimerId);
			}
		},
		videoDone: function(){
			clearInterval(FivekoMedia.videoTimerId);
		},
		loadImage: function(source, callback){
			var image = FivekoMedia.imageElement;
			image.onload = function() {
				var canvas = FivekoMedia.canvasElement;
				FivekoMedia.resizeCanvas(this);
				canvas.getContext('2d').drawImage(this, 0, 0, canvas.width, canvas.height);
				callback();
			};
			window.redraw = function(){
				var canvas = FivekoMedia.canvasElement;
				canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
			};
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
		},
		loadMedia: function(source, callback){

		},
		handleFiles: function(e){
			var file = e.target.files[0];
			var type = file.type;
			var func = (type.substring(0, "image".length) == "image") ? FivekoMedia.loadImage : 
						(type.substring(0, "video".length) == "video") ? FivekoMedia.loadVideo : 
						function(){ };
			func(file, function(){
				//document.getElementById('cmbFilters').onchange();
				FivekoFilters.update();
			});
		}

	};
	
	
	function createPanel(preview){
		var panel = document.createElement('div');
		
		panel.style.padding = "1.2rem";
		panel.innerHTML = '<input type="file" style="display: none;"><button data-role="browse" style="margin: 10px; width: 100px;">Browse</button><button data-role="camera" style="margin: 10px; width: 100px;">Camera</button><button data-role="reset" style="margin: 10px; width: 100px;">Reset</button><select id="cmbFilters"></select>';
		// Hook events to panel controls 
		panel.querySelector('input[type=file]').addEventListener('change', FivekoMedia.handleFiles);
		panel.querySelector('button[data-role=browse]').addEventListener('click', function(){
			panel.querySelector('input[type=file]').click();
		});
		
		panel.querySelector('button[data-role=camera]').addEventListener('click', FivekoMedia.createVideo);
		panel.querySelector('button[data-role=reset]').addEventListener('click', function(){ window.redraw(); });
		
		if (preview.getAttribute("data-hide-selector") === 'true'){
			panel.querySelector('#cmbFilters').style.display = "none";
		}
		FivekoMedia.canvasElement.style.maxWidth = "100%";
		preview.insertBefore(panel, preview.firstChild);
	}

	window.addFilter = FivekoFilters.addFilter;
	window.Filter = Filter;
	window.createSlider = FivekoFilters.createSlider;
	window.createButton = FivekoFilters.createButton;
	window.createCheckbox = FivekoFilters.createCheckbox;
	window.createDropdown = FivekoFilters.createDropdown;
	window.createSelector = FivekoFilters.createSelector;
	

	function Execute(){
		console.log("test");
		var preview = document.querySelector('div[data-role=preview]');
		if (preview){
			var callbackName = preview.getAttribute("data-callback");
			var filterName = preview.getAttribute("data-filter");
			var source = preview.getAttribute("data-source");
			var loader = preview.querySelector(".loader");
			if (loader){
				loader.classList.remove("loader");
			}
			preview.insertBefore(FivekoMedia.canvasElement, preview.firstChild);
			createPanel(preview);
			FivekoFilters.create(window[callbackName]);
			FivekoMedia.loadImage(source, function(){
				FivekoFilters.select(filterName);
			});
		}
	}
	window.addEventListener('load', function(e) {
		Execute();
	}, true);

}(window));