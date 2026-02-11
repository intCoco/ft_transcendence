export const controlsHint = {
	show: false,
	timer: 0,
	duration: 2.5,
	alpha: 1,
};

export function showControlsHint() {
	controlsHint.show = true;
	controlsHint.timer = 0;
}

export function updateControlsHint(delta: number) {
	if (!controlsHint.show) return;

	controlsHint.timer += delta;
	if (controlsHint.timer >= controlsHint.duration) {
		controlsHint.show = false;
	}
	if (controlsHint.timer >= controlsHint.duration - 0.5) {
		controlsHint.alpha = 1 - (controlsHint.timer - (controlsHint.duration - 0.5)) / 0.5;
	} else {
		controlsHint.alpha = 1;
	}
}
