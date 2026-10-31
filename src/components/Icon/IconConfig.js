import { faClock as clockOutline } from '@fortawesome/free-regular-svg-icons';
import {
  faArrowsRotate, faCheck, faSpinner, faChevronLeft, faChevronRight,
  faChevronDown, faXmark, faStar, faArrowUpRightFromSquare,
  faCircleInfo, faCircleExclamation, faPaperPlane, faBug, faTriangleExclamation, faInfo, faExclamation, faArrowUp, faFlask,
  faBell, faBolt, faCalendarDays, faGauge, faGear, faGift, faPalette, faShieldHalved, faSliders,
} from '@fortawesome/free-solid-svg-icons';

export const icons = {
  'arrow-up': faArrowUp,
  'arrow-up-right': faArrowUpRightFromSquare,
  bell: faBell,
  bolt: faBolt,
  bug: faBug,
  calendar: faCalendarDays,
  check: faCheck,
  'chevron-down': faChevronDown,
  'chevron-left': faChevronLeft,
  'chevron-right': faChevronRight,
  'circle-exclamation': faCircleExclamation,
  'circle-info': faCircleInfo,
  'clock-outline': clockOutline,
  close: faXmark,
  exclamation: faExclamation,
  flask: faFlask,
  gauge: faGauge,
  gear: faGear,
  gift: faGift,
  info: faInfo,
  palette: faPalette,
  'paper-plane': faPaperPlane,
  refresh: faArrowsRotate,
  shield: faShieldHalved,
  sliders: faSliders,
  spinner: faSpinner,
  star: faStar,
  'triangle-exclamation': faTriangleExclamation,
};

export const isIconName = (name) => Object.hasOwn(icons, name);
