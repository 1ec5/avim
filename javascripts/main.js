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
			$(".version").text(version);
			
			var mdown = $(markdown.toHTML(release.body));
			$("#relnotes").html(mdown);
			var screenshot = $("#relnotes").find("img, video, audio");
			var iv = $("#relnotes > hr:first-of-type").prevAll();
			var en = $("#relnotes > hr:first-of-type").nextUntil("hr");
			var es = $("#relnotes > hr:nth-of-type(2)").nextAll();
			if (lang !== "vi") iv.detach();
			if (lang !== "en") en.detach();
			if (lang !== "es") es.detach();
			$("#relnotes > hr").detach();
			$("#relnotes").prepend(screenshot.css("float", "right"));
		},
	});
}
