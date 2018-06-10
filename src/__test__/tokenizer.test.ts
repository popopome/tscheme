import { makeTokenizer, TokenType } from '../tokenizer';
import { makeCharReader } from '../char-reader';

test('tokenizer should parse empty list well', () => {
  const t = makeTokenizer(makeCharReader('(a)'));
  expect(t.next().type).toEqual(TokenType.OPEN_PAREN);
  expect(t.next().type).toEqual(TokenType.SYMBOL);
  expect(t.next().type).toEqual(TokenType.CLOSE_PAREN);
  expect(t.next().type).toEqual(TokenType.EOF);
});

test('tokenizer should make valid tokens', () => {
  const t = makeTokenizer(makeCharReader('( a b c "d1 d2 d3" 123 f)'));
  expect(t.next()).toMatchSnapshot();
  expect(t.next()).toMatchSnapshot();
  expect(t.next()).toMatchSnapshot();
  expect(t.next()).toMatchSnapshot();
  expect(t.next()).toMatchSnapshot();
  expect(t.next()).toMatchSnapshot();
});

test('tokenizer should report error', () => {
  try {
    const t = makeTokenizer(makeCharReader('( "thank'));
    t.next();
    t.next();
  } catch (err) {
    expect(JSON.stringify(err)).toMatchSnapshot();
    return;
  }
  expect(false).toBe('SHOULD NOT BE HERE');
});
