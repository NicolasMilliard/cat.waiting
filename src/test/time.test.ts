import * as assert from 'node:assert/strict';
import { getRemainingMilliseconds } from '../time';

const MINUTE = 60_000;

suite('Home time calculation', () => {
  test('calculates the time until today\'s home time in local time', () => {
    const now = new Date(2026, 9, 7, 17, 48);

    assert.strictEqual(getRemainingMilliseconds('18:00', now), 12 * MINUTE);
  });

  test('returns zero at the exact home time', () => {
    const now = new Date(2026, 9, 7, 18, 0);

    assert.strictEqual(getRemainingMilliseconds('18:00', now), 0);
  });

  test('preserves overtime instead of moving the target to tomorrow', () => {
    const now = new Date(2026, 9, 7, 18, 17);

    assert.strictEqual(getRemainingMilliseconds('18:00', now), -17 * MINUTE);
  });

  test('includes seconds and milliseconds in the remaining duration', () => {
    const now = new Date(2026, 9, 7, 17, 59, 59, 250);

    assert.strictEqual(getRemainingMilliseconds('18:00', now), 750);
  });

  test('clears the target seconds and milliseconds during overtime', () => {
    const now = new Date(2026, 9, 7, 18, 0, 1, 250);

    assert.strictEqual(getRemainingMilliseconds('18:00', now), -1_250);
  });

  test('accepts midnight as a target on the current day', () => {
    const now = new Date(2026, 9, 7, 0, 1);

    assert.strictEqual(getRemainingMilliseconds('00:00', now), -MINUTE);
  });

  test('accepts the last minute of the day', () => {
    const now = new Date(2026, 9, 7, 23, 58);

    assert.strictEqual(getRemainingMilliseconds('23:59', now), MINUTE);
  });

  test('starts a new daily target after midnight', () => {
    const now = new Date(2026, 9, 8, 0, 0);

    assert.strictEqual(
      getRemainingMilliseconds('18:00', now),
      18 * 60 * MINUTE,
    );
  });

  test('does not mutate the supplied date', () => {
    const now = new Date(2026, 9, 7, 17, 48, 12, 345);
    const originalTimestamp = now.getTime();

    getRemainingMilliseconds('18:00', now);

    assert.strictEqual(now.getTime(), originalTimestamp);
  });

  test('rejects malformed and out-of-range HH:mm values', () => {
    const now = new Date(2026, 9, 7, 12, 0);
    const invalidTimes = [
      '',
      'noon',
      '9:00',
      '18:0',
      '1800',
      '18.00',
      '18:00:00',
      '24:00',
      '23:60',
      '-1:00',
      '12:-1',
      ' 18:00',
      '18:00 ',
      '18:00\n',
    ];

    for (const homeTime of invalidTimes) {
      assert.throws(
        () => getRemainingMilliseconds(homeTime, now),
        /HH:mm/,
        `Expected ${JSON.stringify(homeTime)} to be rejected`,
      );
    }
  });
});
