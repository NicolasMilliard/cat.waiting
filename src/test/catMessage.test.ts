import * as assert from 'node:assert/strict';
import { getCatMessage, getCatState, type CatState } from '../catMessage';

const MINUTE = 60_000;
const FIVE_MINUTES = 5 * MINUTE;
const NOW = new Date(Date.UTC(2026, 9, 7, 12, 0));

suite('Cat feeling boundaries', () => {
  const cases: [string, number, CatState][] = [
    ['more than two hours before home', 120 * MINUTE + 1, 'sleeping'],
    ['exactly two hours before home', 120 * MINUTE, 'playing'],
    ['just under two hours before home', 120 * MINUTE - 1, 'playing'],
    ['more than one hour before home', 60 * MINUTE + 1, 'playing'],
    ['exactly one hour before home', 60 * MINUTE, 'looking_at_door'],
    ['just under one hour before home', 60 * MINUTE - 1, 'looking_at_door'],
    [
      'more than fifteen minutes before home',
      15 * MINUTE + 1,
      'looking_at_door',
    ],
    ['exactly fifteen minutes before home', 15 * MINUTE, 'waiting'],
    ['just under fifteen minutes before home', 15 * MINUTE - 1, 'waiting'],
    ['just before home time', 1, 'waiting'],
    ['at home time', 0, 'waiting'],
    ['just after home time', -1, 'waiting'],
    ['just under thirty minutes overtime', -30 * MINUTE + 1, 'waiting'],
    ['exactly thirty minutes overtime', -30 * MINUTE, 'waiting'],
    ['more than thirty minutes overtime', -30 * MINUTE - 1, 'angry'],
    ['just under ninety minutes overtime', -90 * MINUTE + 1, 'angry'],
    ['exactly ninety minutes overtime', -90 * MINUTE, 'angry'],
    ['more than ninety minutes overtime', -90 * MINUTE - 1, 'given_up_on_you'],
  ];

  for (const [description, remainingMilliseconds, expectedState] of cases) {
    test(description, () => {
      assert.strictEqual(getCatState(remainingMilliseconds), expectedState);
    });
  }
});

suite('Cat message duration and personalization', () => {
  const cases: [string, number, string][] = [
    ['rounds a remaining fraction of a minute up', 1, '1 min until'],
    ['keeps an exact remaining minute', MINUTE, '1 min until'],
    ['rounds just over a minute up', MINUTE + 1, '2 min until'],
    ['formats minutes without zero hours', 12 * MINUTE, '12 min until'],
    ['formats an exact hour without zero minutes', 60 * MINUTE, '1h until'],
    ['formats hours and minutes', 75 * MINUTE, '1h 15 min until'],
    ['shows sub-minute overtime honestly', -1, 'less than 1 min past'],
    [
      'does not round almost one minute of overtime up',
      -MINUTE + 1,
      'less than 1 min past',
    ],
    ['shows an exact completed overtime minute', -MINUTE, '1 min past'],
    ['counts only completed overtime minutes', -2 * MINUTE + 1, '1 min past'],
    ['formats light overtime', -17 * MINUTE, '17 min past'],
    ['formats substantial overtime', -75 * MINUTE, '1h 15 min past'],
  ];

  for (const [description, remainingMilliseconds, expectedDuration] of cases) {
    test(description, () => {
      const message = getCatMessage('Mochi', remainingMilliseconds, NOW);

      assert.ok(
        message.tooltip.startsWith(
          `${expectedDuration} your expected home time.`,
        ),
        message.tooltip,
      );
    });
  }

  test('uses the supplied cat name in a personalized message', () => {
    const message = getCatMessage('Mochi', 12 * MINUTE, NOW);

    assert.ok(message.text.includes('Mochi'));
    assert.ok(!message.text.includes('Milo'));
  });

  test('recognizes the exact home time instead of calling it overtime', () => {
    const message = getCatMessage('Mochi', 0, NOW);

    assert.strictEqual(message.state, 'waiting');
    assert.ok(message.tooltip.includes("It's home time!"));
    assert.ok(message.tooltip.includes('Mochi'));
    assert.ok(!message.tooltip.includes('past your expected home time'));
  });

  test('switches waiting messages immediately when overtime starts', () => {
    const before = getCatMessage('Mochi', 12 * MINUTE, NOW);
    const after = getCatMessage('Mochi', -17 * MINUTE, NOW);

    assert.strictEqual(before.state, 'waiting');
    assert.strictEqual(after.state, 'waiting');
    assert.notStrictEqual(before.text, after.text);
    assert.ok(before.tooltip.includes('until your expected home time'));
    assert.ok(after.tooltip.includes('past your expected home time'));
  });
});

suite('Cat message rotation', () => {
  test('repeats identical messages for identical inputs', () => {
    const first = getCatMessage('Mochi', 12 * MINUTE, NOW);
    const second = getCatMessage('Mochi', 12 * MINUTE, NOW);

    assert.deepStrictEqual(first, second);
  });

  test('keeps wording stable within a five-minute interval', () => {
    const start = getCatMessage('Mochi', 12 * MINUTE, NOW);
    const end = getCatMessage(
      'Mochi',
      12 * MINUTE,
      new Date(NOW.getTime() + FIVE_MINUTES - 1),
    );

    assert.strictEqual(start.text, end.text);
  });

  test('rotates at the five-minute boundary', () => {
    const before = getCatMessage(
      'Mochi',
      12 * MINUTE,
      new Date(NOW.getTime() + FIVE_MINUTES - 1),
    );
    const after = getCatMessage(
      'Mochi',
      12 * MINUTE,
      new Date(NOW.getTime() + FIVE_MINUTES),
    );

    assert.notStrictEqual(before.text, after.text);
    assert.strictEqual(before.state, after.state);
    assert.strictEqual(before.tooltip, after.tooltip);
  });

  test('updates duration without waiting for message rotation', () => {
    const first = getCatMessage('Mochi', 12 * MINUTE, NOW);
    const later = getCatMessage(
      'Mochi',
      11 * MINUTE,
      new Date(NOW.getTime() + MINUTE),
    );

    assert.ok(first.tooltip.startsWith('12 min until'));
    assert.ok(later.tooltip.startsWith('11 min until'));
  });

  test('changes feeling before the next rotation', () => {
    const before = getCatMessage('Mochi', 15 * MINUTE + 1, NOW);
    const after = getCatMessage('Mochi', 15 * MINUTE, NOW);

    assert.strictEqual(before.state, 'looking_at_door');
    assert.strictEqual(after.state, 'waiting');
    assert.notStrictEqual(before.text, after.text);
  });

  const situations: [string, number, CatState][] = [
    ['sleeping', 180 * MINUTE, 'sleeping'],
    ['playing', 90 * MINUTE, 'playing'],
    ['looking at the door', 30 * MINUTE, 'looking_at_door'],
    ['waiting before home time', 12 * MINUTE, 'waiting'],
    ['waiting during light overtime', -17 * MINUTE, 'waiting'],
    ['angry', -45 * MINUTE, 'angry'],
    ['given up', -120 * MINUTE, 'given_up_on_you'],
  ];

  for (const [description, remaining, expectedState] of situations) {
    test(`provides varied, nonempty messages when ${description}`, () => {
      const variants = new Set<string>();

      for (let step = 0; step < 4; step++) {
        const message = getCatMessage(
          'Mochi',
          remaining,
          new Date(NOW.getTime() + step * FIVE_MINUTES),
        );

        assert.strictEqual(message.state, expectedState);
        assert.ok(message.text.trim().length > 0);
        assert.ok(message.tooltip.trim().length > 0);
        variants.add(message.text);
      }

      assert.ok(
        variants.size > 1,
        'The same situation should have multiple messages',
      );
    });
  }
});
