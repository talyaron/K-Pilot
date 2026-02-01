export const keys: { [key: string]: boolean } = {};

document.addEventListener('keydown', (e: KeyboardEvent) => keys[e.code] = true);
document.addEventListener('keyup', (e: KeyboardEvent) => keys[e.code] = false);