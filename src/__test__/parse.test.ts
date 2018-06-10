import { parse } from '../parse';
import { makeCharReader } from '../char-reader';

test('parse should parse a given s-expression and return the AST', () => {
  expect(parse(makeCharReader('(a b)'))).toMatchSnapshot('SIMPLE-PARSE');
  expect(parse(makeCharReader('(a "thanks" 123 b)'))).toMatchSnapshot('LIST');
});
