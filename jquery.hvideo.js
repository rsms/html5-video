/*
 * HTML5 video player.
 *
 * @author Rasmus Andersson <http://hunch.se/>
 * @license MIT (see file LICENSE)
 */
if (window.console === undefined)window.console={log:function(){}};


jQuery.fn.hvideo = function(options){
	var hvideo = {
		/** if <this> should be resized to fit the actual video size */
		autoresize: false
	};
	if (typeof options === 'object') {
		for (var k in options)
			hvideo[k] = options[k];
	}
	
	var rootq = this;
	var vq = rootq.find('video');
	var ctrlq = rootq.find('controls');
	var exctrlq = ctrlq.find('extended');
	var posbarq = ctrlq.find('bar.position');
	var totbarq = ctrlq.find('bar.total');
	var bufbarq = ctrlq.find('bar.buffered');
	var unbbarq = ctrlq.find('bar.unbuffered');
	
	posbarq.width(0);
	bufbarq.width(0);
	
	// hvideo functions
	hvideo.video = vq.get(0);
	hvideo.barRect = totbarq.rect();
	hvideo.zoomed = false;
	hvideo.animatedZoom = true;
	hvideo.layout = function() {
		var vr = vq.rect();
		var margin = 10;
		
		// set control rect to video rect
		ctrlq.rect(vr);
		
		// extended controls
		exctrlq.width(vr.width - parseInt(exctrlq.css('left')) - margin);
		
		// update progress bar
		var prevBarRect = hvideo.barRect;
		hvideo.barRect = totbarq.rect();
		unbbarq.width(hvideo.barRect.width);
		bufbarq.width((bufbarq.width()/prevBarRect.width)*hvideo.barRect.width);
		posbarq.width((posbarq.width()/prevBarRect.width)*hvideo.barRect.width);
	}
	hvideo.togglePlay = function() {
		if (hvideo.video.paused)
			hvideo.video.play();
		else
			hvideo.video.pause();
	}
	hvideo.toggleZoomed = function(ev){
	  if (hvideo.video.webkitEnterFullScreen !== undefined) {
	    return hvideo.video.webkitEnterFullScreen();
	  }
		if (!hvideo.zoomed) {
			// todo: in zoomed mode, hide mouse after N time of 
			//       inactivity (track movement when playing).
			hvideo.zoomed = true;
			hvideo.zoomOriginalRect = vq.rect();
			hvideo.zoomOriginalZIndex = vq.css('z-index');
			hvideo.zoomOriginalPosition = vq.css('position');
			rootq.addClass('zoomed');
			var z = 1000;
			vq.css('z-index', z);
			ctrlq.css('z-index', z+1);
			unbbarq.css('z-index', z+2);
			bufbarq.css('z-index', z+3);
			totbarq.css('z-index', z+4);
			posbarq.css('z-index', z+5);
			hvideo.updateSizeInZoomMode(null, true);
			$(window).bind('resize', hvideo.updateSizeInZoomMode);
		}
		else {
			hvideo.zoomed = false;
			rootq.removeClass('zoomed');
			$(window).unbind('resize', hvideo.updateSizeInZoomMode);
			var z = parseInt(hvideo.zoomOriginalZIndex);
			vq.css('z-index', hvideo.zoomOriginalZIndex);
			ctrlq.css('z-index', z+1);
			unbbarq.css('z-index', z+2);
			bufbarq.css('z-index', z+3);
			totbarq.css('z-index', z+4);
			posbarq.css('z-index', z+5);
			
			/* CURRENTLY BROKEN
			if (animate === true && hvideo.animatedZoom) {
				vq.animate({
					left: hvideo.zoomOriginalRect.x+'px',
					top: hvideo.zoomOriginalRect.y+'px',
					width: hvideo.zoomOriginalRect.width+'px',
					height: hvideo.zoomOriginalRect.height+'px'
				}, 120, 'swing', function(){
					vq.trigger('resize');
				});
			}
			else {*/
				vq.rect(hvideo.zoomOriginalRect);
				vq.trigger('resize');
			//}
		}
	}
	hvideo.formatTime = function(seconds) {
		var m = parseInt(seconds/60);
		var s = parseInt(seconds - m);
		return ''+m+':'+(s > 9 ? s : '0'+s);
	}
	hvideo.seek = function(pos, dry) {
		var tr = hvideo.video.seekable;
		if (dry === undefined) dry = false;
		if (tr.length === 0) {
			// not seekable
			return false;
		}
		else if (tr.length === 1 && tr.start(0)+hvideo.video.duration === tr.end(0)) {
			// can seek anywhere
			if (!dry)
				hvideo.video.currentTime = hvideo.video.duration * pos;
			return hvideo.video.duration * pos;
		}
		else {
			// can only seek to specific ranges -- find closest match
			var requestedTime = hvideo.video.duration * pos;
			var closestTime = null;
			for (var i=0; i<tr.length; i++) {
				var start = tr.start(i);
				var end = tr.end(i);
				if (closestTime === null)
					closestTime = start;
				if (start >= requestedTime && end <= requestedTime) {
					closestTime = requestedTime;
					break;
				}
				var d1 = max(start,requestedTime)-min(start,requestedTime);
				var d2 = max(start,closestTime)-min(start,closestTime);
				if (d1 < d2)
					closestTime = start;
				// todo: better matching by also looking at distance to end
			}
			if (closestTime !== null) {
				if (!dry)
					hvideo.video.currentTime = closestTime;
				return closestTime;
			}
		}
		return false;
	}
	hvideo.isScrubbing = false;
	hvideo.updatePosition = function(currentTime) {
		if (currentTime === undefined)
			currentTime = hvideo.video.currentTime;
		posbarq.width(hvideo.barRect.width * (currentTime / hvideo.video.duration));
		posbarq.find('p.meta').text(hvideo.formatTime(currentTime));
	}
	hvideo.updateSizeInZoomMode = function(ev, animate) {
		var wq = $(window);
		var r = {x:0, y:0, width:wq.width(), height:wq.height()};
		if (animate === true && hvideo.animatedZoom) {
			var vr = vq.rect();
			vq.css({
				position: 'absolute',
				left: vr.x+'px',
				top: vr.y+'px'
			});
			vq.animate({
				left: r.x+'px',
				top: r.y+'px',
				width: r.width+'px',
				height: r.height+'px'
			}, 120, 'swing', function(){
				vq.trigger('resize');
			});
		}
		else {
			vq.rect(r);
			vq.trigger('resize');
		}
	}
	hvideo.ev2pos = function(ev) {
		var pos = (ev.clientX - hvideo.barRect.x) / hvideo.barRect.width;
		var threshold = 0.01;
		if (pos <= threshold)
			pos = 0.0;
		else if (1.0-pos <= threshold)
			pos = 1.0;
		return pos;
	}
	hvideo.inRect = function(x,y, r) {
		return (x >= r.x && x <= r.x+r.width && y >= r.y && y <= r.y+r.height);
	}
	hvideo.scheduleCtrlFadeOut = function() {
		clearInterval(ctrlq.data('hvideo_fadeout_timer'));
		ctrlq.data('hvideo_fadeout_timer', setTimeout(function(){
			clearInterval(ctrlq.data('hvideo_fadeout_timer'));
			ctrlq.fadeOut(100);
		}, 200));
	}
	hvideo.setCursor = function(name) { // xxx wip
		rootq.css('cursor', name);
		ctrlq.css('cursor', name);
	}
	
	// save ref to hvideo struct in root element
	rootq.data('hvideo', hvideo);
	
	// controls events
	ctrlq.mouseover(function(ev){
		clearInterval(ctrlq.data('hvideo_fadeout_timer'));
	}).mouseout(function(ev){
		if (!hvideo.video.paused)
			hvideo.scheduleCtrlFadeOut();
	});
	
	// play/pause button
	ctrlq.find('button.play-pause').click(function(ev){
		hvideo.togglePlay();
	});
	
	// mute audio button
	ctrlq.find('button.mute-audio').click(function(ev){
		hvideo.video.muted = !hvideo.video.muted;
	});
	
	// zoom control
	ctrlq.bind('dblclick', function(ev) {
		// skip if double-clicked in controls rect
		var r = exctrlq.rect();
		var r2 = ctrlq.rect();
		r.x = r2.x;
		r.width = r2.width;
		if (!hvideo.inRect(ev.clientX, ev.clientY, r))
			hvideo.toggleZoomed();
	});
	ctrlq.find('button.zoom').click(hvideo.toggleZoomed);
	
	// progress seek
	var seekfunc = function(ev){
		hvideo.seek(hvideo.ev2pos(ev));
		//console.log(ev, ev.clientX, ev.clientY, pos);
	}
	posbarq.click(seekfunc);
	totbarq.click(seekfunc);
	
	// progress scrubbing
	var scrubSeekDelay = 20;
	var scrubSeekDelayTimer = null;
	var scrubVideoWasPaused = hvideo.video.paused;
	var scrubfunc = function(ev){
		var pos = hvideo.ev2pos(ev);
		// only do coninuous seek if we have it buffered
		var seektime = hvideo.video.duration * pos;
		var tr = hvideo.video.buffered;
		if (tr.length && seektime >= tr.start(0) && seektime <= tr.end(0)) {
			// todo: support multiple TimeRange's
			clearInterval(scrubSeekDelayTimer);
			scrubSeekDelayTimer = setTimeout(function(){ hvideo.seek(pos) }, scrubSeekDelay);
		}
		
		hvideo.updatePosition(hvideo.video.duration * pos);
	}
	var stopscrubfunc = function(ev) {
		hvideo.isScrubbing = false;
		totbarq.unbind('mousemove', scrubfunc);
		posbarq.unbind('mousemove', scrubfunc);
		hvideo.seek(hvideo.ev2pos(ev));
		if (!scrubVideoWasPaused)
			hvideo.video.play();
	}
	var startscrubfunc = function(ev) {
		scrubVideoWasPaused = hvideo.video.paused;
		if (!scrubVideoWasPaused)
			hvideo.video.pause();
		hvideo.isScrubbing = true;
		totbarq.mousemove(scrubfunc);
		posbarq.mousemove(scrubfunc);
	}
	totbarq.mousedown(startscrubfunc);
	posbarq.mousedown(startscrubfunc);
	totbarq.mouseup(stopscrubfunc);
	posbarq.mouseup(stopscrubfunc);
	
	// todo: better solution
	// keypress is not emmitted on the ctrl, video or any other element.
	$(window).keypress(function(ev){
		if (ev.which === 32) {
			hvideo.togglePlay();
			if (!hvideo.video.paused)
				hvideo.scheduleCtrlFadeOut();
		}
	});
	$(document).keydown(function(ev){
		if (ev.which === 27 && hvideo.zoomed) {
			// Ugly because we need to work around some layouting bugs
			// Still quite buggy, for instance when video is paused and
			// ctrl is not visible, they will never again be visible.
			var op = ctrlq.css('opacity');
			ctrlq.css('opacity', 0.001);
			ctrlq.show();
			hvideo.toggleZoomed();
			ctrlq.fadeOut(100, function(){
				ctrlq.css('opacity', 1.0);
			});
		}
	});
	
	// video events
	vq.mouseover(function(ev){
		if (!this.paused)
			ctrlq.fadeIn(100);
	}).bind('resize', function(ev){
		hvideo.layout();
		if (hvideo.zoomed)
			ctrlq.find('button.zoom').addClass('zoomed');
		else
			ctrlq.find('button.zoom').removeClass('zoomed');
	}).bind('canplaythrough', function(ev){
		unbbarq.hide();
		bufbarq.width(hvideo.barRect.width);
	}).bind('durationchange', function(ev){
		totbarq.find('p.meta').text(hvideo.formatTime(this.duration));
		// todo: update/redraw all bars
	}).bind('ended', function(ev){
		this.pause();
	}).bind('error', function(ev){
		console.log('error -- failed to load video', ev);
	}).bind('loadedmetadata', function(ev){
		if (hvideo.autoresize) {
			vq.width(hvideo.video.videoWidth).height(hvideo.video.videoHeight);
			vq.trigger('resize');
		}
	}).bind('volumechange', function(ev){
		if (hvideo.video.muted)
			ctrlq.find('button.mute-audio').addClass('muted');
		else
			ctrlq.find('button.mute-audio').removeClass('muted');
	}).bind('play', function(ev){
		// will play
		if (this.ended)
			hvideo.seek(0);
	}).bind('playing', function(ev){
		ctrlq.find('button.play-pause').addClass('playing').removeClass('paused');
	}).bind('pause', function(ev){
		ctrlq.find('button.play-pause').addClass('paused').removeClass('playing');
		clearInterval(ctrlq.data('hvideo_fadeout_timer'));
		ctrlq.fadeIn(100);
	}).bind('progress', function(ev){
		var tr = this.buffered;
		if (tr.length) {
			// todo: support multiple TimeRange's
			bufbarq.width(hvideo.barRect.width *
				((this.buffered.end(0)-this.buffered.start(0)) / this.duration));
		}
	}).bind('timeupdate', function(ev){
		if (!hvideo.isScrubbing)
			hvideo.updatePosition();
	})/* xxx wip:
	.bind('waiting', function(ev){
		ctrlq.find('button.play-pause').css('cursor', 'progress');
	}).bind('playing', function(ev){
		ctrlq.find('button.play-pause').css('cursor', 'auto');
	})*/;
	
	hvideo.layout();
	
	return this;
}


// geometry: global frame
if(jQuery.fn.rect===undefined)jQuery.fn.rect = function(setrect){
	if (setrect !== undefined) {
		return this.css({
			left: parseInt(setrect.x)+'px',
			top: parseInt(setrect.y)+'px',
			width: parseInt(setrect.width)+'px',
			height: parseInt(setrect.height)+'px',
			position: 'absolute'
		});
	}
	else {
		var p = this.offset();
		return {x:p.left, y:p.top, width:this.width(), height:this.height()};
	}
}
// geometry: size
if(jQuery.fn.dimensions===undefined)jQuery.fn.dimensions = function(setsize){
	if (setsize !== undefined) {
		return this.css({
			width: parseInt(setsize.width)+'px',
			height: parseInt(setsize.height)+'px'
		});
	}
	else {
		return {width:this.width(), height:this.height()};
	}
}
// geometry: position
if(jQuery.fn.origin===undefined)jQuery.fn.origin = function(setpoint){
	if (setpoint !== undefined) {
		return this.css({
			left: parseInt(setpoint.x)+'px',
			top: parseInt(setpoint.y)+'px',
			position: 'absolute'
		});
	}
	else {
		var p = this.offset();
		return {x:p.left, y:p.top};
	}
}

