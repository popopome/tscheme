import { evaluate } from '../evaluate';
import { makeEnv } from '../env';

test('evaluate should evaluate basic operation', () => {
  expect(evaluate('(+ 1 3)')).toBe(4);
  expect(
    evaluate(`(begin 
        (define x 3)
    (+ 1 3 x)
    
    `)
  ).toBe(7);
});
