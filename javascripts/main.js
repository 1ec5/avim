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
