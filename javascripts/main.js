if (!String.prototype.startsWith) {
	Object.defineProperty(String.prototype, "startsWith", {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function(searchString, position) {
			position = position || 0;
			return this.lastIndexOf(searchString, position) === position;
		}
	});
}

if (!String.prototype.endsWith) {
	Object.defineProperty(String.prototype, "endsWith", {
		value: function(searchString, position) {
			var subjectString = this.toString();
			if (position === undefined || position > subjectString.length) {
				position = subjectString.length;
			}
			position -= searchString.length;
			var lastIndex = subjectString.indexOf(searchString, position);
			return lastIndex !== -1 && lastIndex === position;
		}
	});
}

function buildCarousel() {
	if (!$(".carousel").length) return;
	
	var selectedIdx = 0,
		figures = $(".carousel figure"),
		currentVideo;
	
	function updateStatus() {
		$(".carousel .status").text((selectedIdx + 1) + " / " + figures.length);
	}
	
	function selectFigure(idx) {
		selectedIdx = idx;
		figures.each(function (figureIdx, figure) {
			$(figure).toggleClass("selected", selectedIdx === figureIdx);
			$(figure).find("video").each(function (videoIdx, video) {
				if (selectedIdx === figureIdx) {
					currentVideo = video;
					video.currentTime = 0;
					video.play();
				}
				else {
					currentVideo = null;
					video.pause();
				}
			});
		});
		updateStatus();
	}
	selectFigure(0);
	
	var skip = false;
	$(".carousel button").click(function (evt) {
		var newIdx = (selectedIdx + parseInt(this.value, 10) +
					  figures.length) % figures.length;
		selectFigure(newIdx);
		skip = true;
	});
	
	setInterval(function () {
		if (currentVideo && !currentVideo.paused) return;
		if (skip) skip = false;
		else selectFigure((selectedIdx + 1) % figures.length);
	}, 5 * 1000);
}

function showReleaseNotes() {
	var lang = document.documentElement.lang;
	var version = location.search.match(/\bversion=\*\.([.0-9a-z]+)/);
	version = version && version[1];
	
	var url = "https://github.com/1ec5/avim/releases/tag/v" + version;
	$("#relnotes").html("<a href='" + url + "'>Xem tại GitHub</a>");
	
	$.ajax("https://api.github.com/repos/1ec5/avim/releases", {
		ifModified: true,
		complete: function (data) {
			var releases = data.responseJSON;
			var release = releases[0];
			for (var i = 0; i < releases.length; i++) {
				if (releases[i].tag_name === "v" + version) {
					release = releases[i];
					break;
				}
			}
			
			version = release.tag_name.replace(/^v/, "");
			$(".version").text($(".version").data("prefix") + " " + version);
			
			var mdown = $(markdown.toHTML(release.body));
			$("#relnotes").html(mdown);
			var screenshot = $("#relnotes").find("img, video, audio");
			var iv = $("#relnotes > hr:first-of-type").prevAll();
			var en = $("#relnotes > hr:first-of-type").nextUntil("hr");
			var es = $("#relnotes > hr:nth-of-type(2)").nextAll();
			if (lang !== "vi") iv.detach();
			if (lang !== "en-US") en.detach();
			if (lang !== "es") es.detach();
			$("#relnotes > hr").detach();
			$("#relnotes").prepend(screenshot.css("float", "right"));
		},
	});
}

function buildAnim(animIdx, anim) {
	anim = $(anim);
	var wayBefore = anim.find(".way-before-caret"),
		wayAfter = anim.find(".way-after-caret"),
		before = anim.find(".before-caret"),
		after = anim.find(".after-caret"),
		meter = anim.find("meter"),
		chord = anim.data("chords").split("|"),
		i = 0;
	
	function deleteAll() {
		anim.find("span").removeClass("selected");
		anim.find("span").html("");
		before.addClass("idle");
		meter.val(0);
		setTimeout(step, 0.5 * 1000);
	}
	
	function selectAll() {
		before.removeClass("idle");
		anim.find("span").addClass("selected");
		setTimeout(deleteAll, 0.5 * 1000);
	}
	
	function step() {
		before.removeClass("idle");
		var text = chord[i++],
			segments,
			timeout = 250;
		if (text) {
			segments = /([^/]+)(?:\/(.+))?/.exec(text);
			if (!segments[1].endsWith(" ")) {
				segments[3] = /\S+$/.exec(segments[1]);
				segments[3] = segments[3] && segments[3][0];
				segments[1] = segments[1].replace(/\S+$/, "");
			}
			if (segments[2] && !segments[2].startsWith(" ")) {
				segments[4] = /^\S+/.exec(segments[2]);
				segments[4] = segments[4] && segments[4][0];
				segments[2] = segments[2].replace(/^\S+/, "");
			}
			
			wayBefore.html(segments[1] || "");
			before.html(segments[3] || "");
			after.html(segments[4] || "");
			wayAfter.html(segments[2] || "");
			meter.val(i);
			
			if (i < chord.length) {
				if (chord[i].startsWith(text)) timeout -= 100;
				else if (chord[i].replace("/", "") === text.replace("/", "")) {
					timeout -= 150;
				}
				if (!chord[i].endsWith(" ") && text.endsWith(" ")) {
					timeout += 100;
				}
			}
			setTimeout(step, timeout + (Math.random() - 0.5) * 100);
		}
		else {
			before.addClass("idle");
			i = 0;
			setTimeout(selectAll, 5 * 1000);
		}
	}
	before.addClass("idle");
	setTimeout(step, 2 * 1000);
}

function buildAnims() {
	$(".anim").each(buildAnim);
}
