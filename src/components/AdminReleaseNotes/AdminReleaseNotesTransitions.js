/* eslint-disable no-param-reassign */

const resetReleaseGroupStyles = (element) => {
  element.style.height = '';
  element.style.opacity = '';
  element.style.transform = '';
};

export const onAfterReleaseGroupEnter = (element) => {
  resetReleaseGroupStyles(element);
};

export const onAfterReleaseGroupLeave = (element) => {
  resetReleaseGroupStyles(element);
};

export const onBeforeReleaseGroupEnter = (element) => {
  element.style.height = '0';
  element.style.opacity = '0';
  element.style.transform = 'scaleY(0.97)';
};

export const onBeforeReleaseGroupLeave = (element) => {
  element.style.height = `${element.scrollHeight}px`;
  element.style.opacity = '1';
  element.style.transform = 'scaleY(1)';
};

export const onReleaseGroupEnter = (element, animate = requestAnimationFrame) => {
  // Force a layout so the browser animates from the collapsed state.
  void element.offsetHeight;
  animate(() => {
    element.style.height = `${element.scrollHeight}px`;
    element.style.opacity = '1';
    element.style.transform = 'scaleY(1)';
  });
};

export const onReleaseGroupLeave = (element, animate = requestAnimationFrame) => {
  void element.offsetHeight;
  animate(() => {
    element.style.height = '0';
    element.style.opacity = '0';
    element.style.transform = 'scaleY(0.97)';
  });
};
