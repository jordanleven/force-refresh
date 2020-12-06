let isDebugActive;

export const getDebugMode = () => isDebugActive ?? false;

export const setDebugMode = (active) => { isDebugActive = active; };
