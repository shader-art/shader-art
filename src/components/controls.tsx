export function PlayIcon() {
	return (
		<svg aria-hidden="true" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="m10 10 80 40-80 40z"/></svg>
	);
};

export function PauseIcon() {
	return (
		<svg aria-hidden="true" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M10 10h30v80H10m50-80h30v80H60z"/></svg>
	);
}

export class Controls() {
	
	static LANG = {
		play: 'Play',
		pause: 'Pause'
	};
	
	constructor(public container: HTMLElement) {}
	
	create() {
		renderTree(this.container, <>
			<button title={Controls.LANG.Play}><PlayIcon /></button>
			<button title={Controls.LANG.Pause}><PauseIcon /></button>"
			<PauseIcon />
		</>);
	}
	
	dispose() {
		
	}
	
}