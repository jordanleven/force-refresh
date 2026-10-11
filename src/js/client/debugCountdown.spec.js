import { setDebugMode } from '@/js/services/debugService.js';
import { COUNTDOWN_INTERVAL_MS, startDebugCountdown } from './debugCountdown.js';

describe('startDebugCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setDebugMode(true);
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    setDebugMode(false);
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('logs the seconds until the next check on every countdown interval', () => {
    startDebugCountdown(() => 25000);
    jest.advanceTimersByTime(COUNTDOWN_INTERVAL_MS);
    expect(console.debug).toHaveBeenCalledWith(expect.stringContaining('Next check in 25 seconds.'));
  });

  it('reflects the changing time until the next check', () => {
    const getMsUntilNextCheck = jest.fn().mockReturnValueOnce(25000).mockReturnValueOnce(20000);
    startDebugCountdown(getMsUntilNextCheck);
    jest.advanceTimersByTime(COUNTDOWN_INTERVAL_MS * 2);
    expect(console.debug).toHaveBeenLastCalledWith(expect.stringContaining('Next check in 20 seconds.'));
  });

  it('logs nothing while no check is scheduled', () => {
    startDebugCountdown(() => null);
    jest.advanceTimersByTime(COUNTDOWN_INTERVAL_MS);
    expect(console.debug).not.toHaveBeenCalled();
  });

  it('stops logging once the returned function is called', () => {
    const stop = startDebugCountdown(() => 25000);
    stop();
    jest.advanceTimersByTime(COUNTDOWN_INTERVAL_MS);
    expect(console.debug).not.toHaveBeenCalled();
  });
});
