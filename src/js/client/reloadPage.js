// Isolated so specs can replace it; jsdom does not allow `location.reload` to be mocked.
export const reloadPage = () => window.location.reload();
