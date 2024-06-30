export function PlayIcon() {
	return (
		<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  		<path fill="currentColor" d="M10 10L90 50 10 90z"></path>
		</svg>
	);
};

export function PauseIcon() {
	return (
		<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  		<path fill="currentColor" d="M10 10 H40 V90 H10 V10 M60 10 H90 V90 H60"></path>
		</svg>
	);
}

export class Controls {
	
	constructor(public parent: Node)
	
	
	render() {
		
	}
	
	
	dispose() {
		
	}
}