import { makeCharReader, ICharReader, ICharPos } from './char-reader';

const WS_CHARS = new Set(' \t\n\r'.split(''));
const DIGITS = new Set('0123456789'.split(''));

function isWhitespace(c: string) {
  return WS_CHARS.has(c);
}
function isDigit(c: string) {
  return DIGITS.has(c);
}

function consumeWhitespace(reader: ICharReader) {
  let c;
  while ((c = reader.next())) {
    if (!isWhitespace(c)) return;
  }
}

export enum TokenType {
  EOF = 'EOF',
  OPEN_PAREN = 'OPEN_PAR',
  CLOSE_PAREN = 'CLOSE_PAREN',
  STRING = 'STRING',
  WORD = 'WORD',
  SYMBOL = 'SYMBOL',
  NUMBER = 'NUMBER',
  LIST = 'LIST'
}

export interface Token {
  type: TokenType;
  begin: ICharPos;
  end: ICharPos;
  value: string | number;
}
export interface Tokenizer {
  next(): Token;
  current(): Token;
}

function makeToken(
  type: TokenType,
  begin: ICharPos,
  end: ICharPos,
  value: string | number
): Token {
  return {
    type,
    begin,
    end,
    value
  };
}

function raiseParseError(msg: string, pos: ICharPos) {
  const err = new Error('parse error');
  (err as any).pos = pos;
  (err as any).msg = msg;
  throw err;
}

function trimDoubleQuote(s: string) {
  return s.substring(1, s.length - 1);
}

function consumeStringToken(reader: ICharReader): any {
  const begin = reader.position();
  let prev = reader.current();

  let c;
  while ((c = reader.next())) {
    if (c === '"') {
      // Escape?
      if (prev !== '\\') {
        reader.next();
        return makeToken(
          TokenType.STRING,
          begin,
          reader.position(),
          trimDoubleQuote(reader.getString(begin, reader.position()))
        );
      }
    }

    prev = c;
  }

  raiseParseError(`String should be closed with "`, reader.position());
}

function parseNumber(s: string): number | undefined {
  const v = parseInt(s);
  if ('' + v === s) return v;
  const r = parseFloat(s);
  if ('' + r === s) return r;
  return undefined;
}

function consumeNextToken(reader: ICharReader): any {
  const begin = reader.position();
  let c;
  while ((c = reader.next())) {
    if (isWhitespace(c) || c === '(' || c === ')') break;
  }

  const value = reader.getString(begin, reader.position());
  const parsedValue = parseNumber(value);
  return makeToken(
    parsedValue === undefined ? TokenType.SYMBOL : TokenType.NUMBER,
    begin,
    reader.position(),
    parsedValue === undefined ? value : parsedValue
  );
}

export function makeTokenizer(reader: ICharReader): Tokenizer {
  reader.next();
  let curr: Token;

  return {
    current(): Token {
      return curr;
    },
    next(): Token {
      return (curr = internalNext());
    }
  };
  function internalNext(): Token {
    const c = reader.current();
    if (!c) {
      return makeToken(TokenType.EOF, reader.position(), reader.position(), '');
    }

    let token;
    if (isWhitespace(c)) {
      consumeWhitespace(reader);
      return internalNext();
    }

    if (c === '(') {
      const pos = reader.position();
      reader.next();
      return makeToken(TokenType.OPEN_PAREN, pos, reader.position(), '(');
    }
    if (c === ')') {
      const pos = reader.position();
      reader.next();
      return makeToken(TokenType.CLOSE_PAREN, pos, reader.position(), ')');
    }
    if (c === '"') {
      return consumeStringToken(reader);
    }

    return consumeNextToken(reader);
  }
}
