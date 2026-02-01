export const keys: { [key: string]: boolean } = {};

document.addEventListener('keydown', (e: KeyboardEvent) => keys[e.code] = true);
document.addEventListener('keyup', (e: KeyboardEvent) => keys[e.code] = false);

// Mouse controls for rolling
let _rollDirection: 'left' | 'right' | null = null;

export function getRollDirection(): 'left' | 'right' | null {
    return _rollDirection;
}

export function resetRollDirection(): void {
    _rollDirection = null;
}

document.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.button === 0) { // Left click
        _rollDirection = 'left';
    } else if (e.button === 2) { // Right click
        _rollDirection = 'right';
    }
});

// Prevent context menu on right click
document.addEventListener('contextmenu', (e: MouseEvent) => {
    e.preventDefault();
});