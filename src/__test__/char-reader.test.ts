import { makeCharReader } from '../char-reader';

test('charReader should be able to track position/line/col', () => {
  const reader = makeCharReader(`(
123 
456
  )`);
  expect(reader.next()).toBe('(');
  expect(reader.next()).toBe('\n');
  expect(reader.next()).toBe('1');
  expect(reader.position()).toMatchObject({
    pos: 2,
    line: 1,
    col: 0
  });

  expect(reader.next()).toBe('2');
  expect(reader.position()).toMatchObject({
    pos: 3,
    line: 1,
    col: 1
  });

  reader.seek(0);
  expect(reader.position()).toMatchObject({
    pos: 0,
    line: 0,
    col: 0
  });
});
