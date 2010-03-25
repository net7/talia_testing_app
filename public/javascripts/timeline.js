/* Make a little class to create a timeline from JSON.
*
* Example:
*
* new Timeline({
*   theme: 'ClassicTheme'
*   startDate: '1900-01-01'
*   stopDate: '2000-01-01'
*   timelineElement: 'tl',
*   url: '.'
*   bands: [{
*     intervalUnit: 'DECADE',
*     intervalPixels: 100,
*     date: '1900-01-01',
*     layout: 'original'
*     // syncWith: 0,
*     // highlight: true
*   }]},
*   timeline_data_as_json
* );
*
*/
function TimelineRunner(params, tl_data) {

		// Create the theme
		TimelineRunner.prototype.createTheme = function(theme, start, stop) {
			theme = Timeline[theme || 'ClassicTheme'].create();
			theme.timeline_start = Timeline.DateTime.parseIso8601DateTime(start || '1900');
			theme.timeline_stop = Timeline.DateTime.parseIso8601DateTime(stop || '2000');
			theme.autoWidth = true;
			this.theme = theme;
		}

		// Create the band objects
		TimelineRunner.prototype.createBands = function(bands) {
			this.bands = new Array();
			// Go through all bands
			for(band in bands) {
				new_band = new Object();
				new_band.width = 70;
				new_band.intervalUnit = Timeline.DateTime[bands[band].intervalUnit || 'DECADE'];
				new_band.intervalPixels = (bands[band].intervalPixels || '100');
				new_band.eventSource = this.eventSource;
				new_band.date = Timeline.DateTime.parseIso8601DateTime(bands[band].date || '1900-01-01');
				new_band.theme = this.theme;
				new_band.overview = bands[band].overview
				new_band.layout = (bands[band].layout || 'original');
				new_band_info = Timeline.createBandInfo(new_band)
				if(bands[band].syncWith != null) { new_band_info.syncWith = bands[band].syncWith; }
				if(bands[band].highlight != null) { new_band_info.highlight = bands[band].highlight; }
				this.bands.push(new_band_info);
			}
			return this.bands;
		}
		
		this.eventSource = params.eventSource;
		this.createTheme(params.theme, params.startDate, params.stopDate);
		this.eventSource = new Timeline.DefaultEventSource();
		this.createBands(params.bands);
		
		the_timeline = this;
		var timeline = null;
		
		// Install the timeline to be initialized on document load
		$(document).ready(function() {
			tl_element = document.getElementById(params.timelineElement || 'tl')
			timeline = Timeline.create(tl_element, the_timeline.bands, Timeline.HORIZONTAL)
			the_timeline.eventSource.loadJSON(tl_data, params.url || '.')
			timeline.layout(); 
		});
		
		// Install the handler to resize the timeline
		var resizeTimerID = null;
		$(window).resize(function() {
			if (resizeTimerID == null) {
				resizeTimerID = window.setTimeout(function() {
					resizeTimerID = null;
					timeline.layout();
					}, 500);
				}
			});
		
		
	}
