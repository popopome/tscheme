import { Env, makeEnv } from './env';
import { Sym, Atom, Num, Exp, Str, parse } from './parse';
import { TokenType } from './tokenizer';
import { makeCharReader, ICharReader, ICharPos } from './char-reader';

function isSym(x: any): x is Sym {
  return x.type === TokenType.SYMBOL;
}
function isSymName(x: any, name: string): x is Sym {
  return isSym(x) && x.value === name;
}

function isNum(x: any): x is Num {
  return x.type === TokenType.NUMBER;
}
function isStr(x: any): x is Str {
  return x.type === TokenType.STRING;
}

function evaluateExp(e: Exp, env: Env): any {
  if (isSym(e)) return env[e.value];
  else if (isNum(e)) return e.value;
  else if (isStr(e)) return e.value;
  else if (isSymName(e.value[0], 'if')) {
    // @ts-ignore
    const [, test, conseq, alt] = exp;
    const exp: Exp = evaluateExp(test, env) ? conseq : alt;
    return evaluateExp(exp, env);
  } else if (isSymName(e.value[0], 'define')) {
    // @ts-ignore
    const [, symbol, exp] = e.value;
    env[(symbol as Sym).value] = evaluateExp(exp, env);
    // side-effect?
  } else {
    const proc: Function = evaluateExp(e.value[0], env);
    // @ts-ignore
    const args = e.value.slice(1).map((v: any) => evaluateExp(v, env));
    return proc.apply(null, args);
  }
}

const globalEnv = makeEnv();
export function evaluate(code: string, env: Env = globalEnv) {
  const reader = makeCharReader(code);
  try {
    const ast = parse(reader);
    return evaluateExp(ast.program, env);
  } catch (err) {
    printSmartError(err, reader);
    throw err;
  }
}

function stringPad(s: string, n: number) {
  return ' '.repeat(Math.max(0, n - s.length)) + s;
}
function formatErrorLine(ln: number, content: string) {
  return `Ln: ${stringPad('' + (ln + 1), 5)} | ${content}`;
}
function getCodes(reader: ICharReader, begin: ICharPos, end: ICharPos) {
  const lines = [];
  for (let ln = begin.line; ln < end.line + 1; ++ln) {
    lines.push(formatErrorLine(ln, reader.getLineString(ln)));
  }
  return lines.join('');
}

function printSmartError(err: any, reader: ICharReader) {
  if (!!err.msg && !!err.begin && !!err.end) {
    const lines = getCodes(reader, err.begin, err.end);
    const headerLine = `${err.tag}: ${err.msg}`;

    const columnMark = formatErrorLine(
      err.end.line,
      ' '.repeat(err.end.col + 1) + '^'
    );

    console.log([headerLine, lines, columnMark].join('\n'));
  }
}
