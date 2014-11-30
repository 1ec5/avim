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
	var carousel = document.getElementsByClassName("carousel");
	if (!carousel || !carousel.length) return;
	carousel = carousel[0];
	
	var selectedIdx = 0,
		figures = carousel.getElementsByTagName("figure"),
		status = carousel.getElementsByClassName("status")[0],
		buttons = carousel.getElementsByTagName("button"),
		currentVideo;
	
	function updateStatus() {
		if (status) {
			status.textContent = (selectedIdx + 1) + " / " + figures.length;
		}
	}
	
	function selectFigure(idx) {
		var i,
			videos,
			j;
		selectedIdx = idx;
		for (i = 0; i < figures.length; i++) {
			figures[i].classList.toggle("selected", selectedIdx == i);
			videos = figures[i].getElementsByTagName("video");
			for (j = 0; j < videos.length; j++) {
				if (selectedIdx == i) {
					currentVideo = videos[j];
					videos[j].currentTime = 0;
					videos[j].play();
				}
				else {
					currentVideo = null;
					videos[j].pause();
				}
			}
		}
		updateStatus();
	}
	selectFigure(0);
	
	var i,
		skip = false;
	for (var i = 0; i < buttons.length; i++) {
		buttons[i].addEventListener("click", function (evt) {
			var newIdx = (selectedIdx + parseInt(this.value, 10) +
						  figures.length) % figures.length;
			selectFigure(newIdx);
			skip = true;
		}, false);
	}
	
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

function buildAnim() {
	var wayBefore = document.getElementById("way-before-caret"),
		wayAfter = document.getElementById("way-after-caret"),
		before = document.getElementById("before-caret"),
		after = document.getElementById("after-caret"),
		chord = "H|Ho|Hom|Hôm|Hôm |Hôm q|Hôm qu|Hôm qua|Hôm qua |Hôm qua |Hôm qua d|Hôm qua đ|Hôm qua đi|Hôm qua đi |Hôm qua đi t|Hôm qua đi tr|Hôm qua đi tre|Hôm qua đi trê|Hôm qua đi trên|Hôm qua đi trên |Hôm qua đi trên n|Hôm qua đi trên nh|Hôm qua đi trên nhu|Hôm qua đi trên nhun|Hôm qua đi trên nhung|Hôm qua đi trên nhưng|Hôm qua đi trên những|Hôm qua đi trên những |Hôm qua đi trên những c|Hôm qua đi trên những co|Hôm qua đi trên những con|Hôm qua đi trên những con |Hôm qua đi trên những con d|Hôm qua đi trên những con du|Hôm qua đi trên những con duo|Hôm qua đi trên những con duon|Hôm qua đi trên những con duong|Hôm qua đi trên những con đuong|Hôm qua đi trên những con đuong |Hôm qua đi trên những con đuong n|Hôm qua đi trên những con đuong ng|Hôm qua đi trên những con đuong ngo|Hôm qua đi trên những con đuong ngoa|Hôm qua đi trên những con đuong ngoan|Hôm qua đi trên những con đuong ngoăn|Hôm qua đi trên những con đuong ngoă/n|Hôm qua đi trên những con đuong ngo/ăn|Hôm qua đi trên những con đuong ng/oăn|Hôm qua đi trên những con đuong n/goăn|Hôm qua đi trên những con đuong /ngoăn|Hôm qua đi trên những con đuong/ ngoăn|Hôm qua đi trên những con đương/ ngoăn|Hôm qua đi trên những con đường/ ngoăn|Hôm qua đi trên những con đường /ngoăn|Hôm qua đi trên những con đường n/goăn|Hôm qua đi trên những con đường ng/oăn|Hôm qua đi trên những con đường ngo/ăn|Hôm qua đi trên những con đường ngoă/n|Hôm qua đi trên những con đường ngoặ/n|Hôm qua đi trên những con đường ngoằ/n|Hôm qua đi trên những con đường ngoằn|Hôm qua đi trên những con đường ngoằn |Hôm qua đi trên những con đường ngoằn n|Hôm qua đi trên những con đường ngoằn ngo|Hôm qua đi trên những con đường ngoằn ngoe|Hôm qua đi trên những con đường ngoằn ngoeo|Hôm qua đi trên những con đường ngoằn ngoèo|Hôm qua đi trên những con đường ngoằn ngoèo.".split("|"),
		i;
	
	function step() {
		before.classList.remove("idle");
		var text = chord.shift(),
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
			
			wayBefore.innerHTML = segments[1] || "";
			before.innerHTML = segments[3] || "";
			after.innerHTML = segments[4] || "";
			wayAfter.innerHTML = segments[2] || "";
			
			if (chord.length) {
				if (chord[0].startsWith(text)) timeout -= 100;
				else if (chord[0].replace("/", "") === text.replace("/", "")) {
					timeout -= 150;
				}
				if (!chord[0].endsWith(" ") && text.endsWith(" ")) {
					timeout += 100;
				}
			}
			setTimeout(step, timeout + (Math.random() - 0.5) * 100);
		}
		else {
			before.classList.add("idle");
		}
	}
	setTimeout(step, 2 * 1000);
}
