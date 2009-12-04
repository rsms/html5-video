if (window.hvideo === undefined)window.hvideo={};

hvideo.debug = function(root, prefix) {
	if (window.console === undefined) {
		alert('hvideo.debug requires a global "console" variable with a callable member "log"');
		return;
	}
	var rootq = $(root);
	var vq = rootq.find('video');
	if(prefix === undefined) prefix = '[hvideo '+rootq.attr('id')+'] ';
	
	// log most media/video specific events
	vq.bind('canplay', function(ev){
		console.log(prefix+'canplay! (can start play, but might has to stop for buffering)');
	}).bind('canplaythrough', function(ev){
		console.log(prefix+'canplaythrough! (can be played to the end, without stopping for buffering)');
	}).bind('durationchange', function(ev){
		console.log(prefix+'durationchange =>', this.duration);
	}).bind('emptied', function(ev){
		console.log(prefix+'emptied! (media resource element suddenly becomes empty. '+
		            '(network errors, errors on load etc.))');
	}).bind('ended', function(ev){
		console.log(prefix+'ended! (reached end)');
	}).bind('error', function(ev){
		console.log(prefix+'error! (load error)');
	}).bind('loadstart', function(ev){
		console.log(prefix+'loadstart!');
	}).bind('loadedmetadata', function(ev){
		console.log(prefix+'loadedmetadata! (duration and other media data of a media element is loaded)');
	}).bind('loadeddata', function(ev){
		console.log(prefix+'loadeddata! (media data is loaded)');
	}).bind('play', function(ev){
		console.log(prefix+'play! (will play)');
	}).bind('playing', function(ev){
		console.log(prefix+'playing! (is playing)');
	}).bind('pause', function(ev){
		console.log(prefix+'pause! (is paused)');
	}).bind('progress', function(ev){
		console.log(prefix+'progress => ', this.readyState, this.buffered);
	}).bind('ratechange', function(ev){
		console.log(prefix+'ratechange!');
	}).bind('seeking', function(ev){
		console.log(prefix+'seeking!');
	}).bind('seeked', function(ev){
		console.log(prefix+'seeked!');
	}).bind('stalled', function(ev){
		console.log(prefix+'stalled!');
	}).bind('suspended', function(ev){
		console.log(prefix+'suspended!');
	}).bind('timeupdate', function(ev){
		console.log(prefix+'timeupdate =>', this.currentTime);
	}).bind('volumechange', function(ev){
		console.log(prefix+'volumechange =>', this.volume);
	}).bind('waiting', function(ev){
		console.log(prefix+'waiting! (stopped playing, but is expected to resume)');
	});
}
