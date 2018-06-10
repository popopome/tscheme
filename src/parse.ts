import { makeTokenizer, TokenType, Tokenizer, Token } from './tokenizer';
import { ICharPos, ICharReader } from './char-reader';

export interface Sym extends Token {
  type: TokenType.SYMBOL;
}
export interface Num extends Token {
  type: TokenType.NUMBER;
}
export interface Str extends Token {
  type: TokenType.STRING;
}

export type Atom = Sym | Num | Str;
export interface List {
  type: TokenType.LIST;
  begin: ICharPos;
  end: ICharPos;
  value: (Atom | List)[];
}

export type Exp = Atom | List;
export interface IAst {
  program: Exp;
}

function raiseParseError(msg: string, begin: ICharPos, end: ICharPos) {
  const err = new Error(msg);
  (err as any).tag = 'PARSE-ERROR';
  (err as any).msg = msg;
  (err as any).begin = begin;
  (err as any).end = end;
  throw err;
}

function parse2(tokenizer: Tokenizer): Exp {
  let tok = tokenizer.current();

  if (tok.type === TokenType.OPEN_PAREN) {
    const list: List = {
      type: TokenType.LIST,
      begin: tok.begin,
      end: tok.end,
      value: []
    };
    tokenizer.next();
    while (
      tokenizer.current().type !== TokenType.CLOSE_PAREN &&
      tokenizer.current().type !== TokenType.EOF
    ) {
      list.value.push(parse2(tokenizer));
    }
    if (tokenizer.current().type === TokenType.CLOSE_PAREN) {
      list.end = tokenizer.current().end;
      tokenizer.next();
      return list;
    }
    raiseParseError(
      'Unable to find close paren',
      list.begin,
      tokenizer.current().end
    );
  }

  if (tok.type === TokenType.CLOSE_PAREN) {
    raiseParseError('Unexpected close paren', tok.end, tok.end);
  }

  if (
    tok.type === TokenType.STRING ||
    tok.type === TokenType.SYMBOL ||
    tok.type === TokenType.NUMBER
  ) {
    tokenizer.next();
    return tok as Atom;
  }

  return null as any;
}

export function parse(reader: ICharReader): IAst {
  try {
    const tokenizer = makeTokenizer(reader);
    tokenizer.next();
    return {
      program: parse2(tokenizer)
    };
  } catch (err) {
    console.log(JSON.stringify(err));
    throw err;
  }
}
