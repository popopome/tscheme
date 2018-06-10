function tokenize(p: string) {
  return p
    .replace(/\(/g, ' ( ')
    .replace(/\)/g, ' ) ')
    .trim()
    .split(/\s+/);
}

const OPEN_PAR = '(';
const CLOSE_PAR = ')';

class Sym {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

class Num {
  value: number;
  constructor(value: number) {
    this.value = value;
  }
}

type Atom = Sym | Num;
interface List<T> {
  [_: number]: T | List<T>;
}
type Exp = Atom | List<Atom>;
interface Env {
  [k: string]: any;
}

function makeAST(tokens: string[]): Exp {
  if (tokens.length === 0) throw new Error('unexpected EOF');

  let tok: string = tokens.shift() as any;
  if (tok === OPEN_PAR) {
    const list = [];
    while (tokens[0] !== CLOSE_PAR) {
      list.push(makeAST(tokens));
    }
    tokens.shift();
    return list;
  }

  if (tok === CLOSE_PAR) {
    throw new Error('unexpected )');
  }

  return makeAtom(tok);
}

function stringToNum(s: string): number | undefined {
  const v = parseInt(s);
  if ('' + v === s) return v;
  const r = parseFloat(s);
  if ('' + r === s) return r;
  return undefined;
}

function makeAtom(tok: string): Atom {
  const n = stringToNum(tok);
  return n !== undefined ? new Num(n) : new Sym(tok);
}

function parse(p: string) {
  return makeAST(tokenize(p));
}

console.log(
  parse(`
(a (b c) 
   (d e) 
   123
   (124.5)
   f)
`)
);

function reduce<T>(ary: T[], f: (a: T, b: T) => T, init?: T) {
  return ary.reduce((acc, v) => (acc === undefined ? v : f(acc, v)), init);
}

function makeMathOp(f: (x: number, y: number) => number) {
  return (...args: number[]) => reduce(args, f);
}

function isSym(x: any): x is Sym {
  return x instanceof Sym;
}
function isSymName(x: any, name: string): x is Sym {
  return isSym(x) && x.name === name;
}

function isNum(x: any): x is Num {
  return x instanceof Num;
}

function makeEnv(): Env {
  return {
    ['+']: makeMathOp((x, y) => x + y),
    ['-']: makeMathOp((x, y) => x - y),
    ['*']: makeMathOp((x, y) => x * y),
    ['/']: makeMathOp((x, y) => x / y),
    ['pi']: Math.PI,
    ['abs']: Math.abs,
    ['append']: (l: any[], x: any) => {
      l.push(x);
      return l;
    },
    ['apply']: Function.prototype.apply,
    ['begin']: (...args: any[]) => args[args.length - 1],
    ['car']: (xs: any[]) => xs[0],
    ['cdr']: (xs: any[]) => xs.slice(1),
    ['cons']: (x: any, y: any[]) => [x, ...y],
    // TODO: is right?
    ['eq?']: (x: any, y: any) => x === y,
    ['expt']: Math.pow,
    ['equal?']: (x: any, y: any) => x === y,
    ['length']: (xs: any[]) => xs.length,
    ['list']: (...xs: any[]) => xs,
    // map:
    ['max']: Math.max,
    ['min']: Math.min,
    ['not']: (x: any) => !x,
    // TODO: right?
    ['null?']: (x: any) => x === [],
    ['number?']: (x: any): x is number => Number.isFinite(x) || Number.isInteger(x),
    ['print']: (...args: any[]) => console.log(JSON.stringify(args)),
    ['procedure?']: (x: any): x is Function => typeof x === 'function',
    ['round']: Math.round,
    ['symbol?']: isSym
  };
}

const globalEnv = makeEnv();
function evaluate(x: Exp, env: Env = globalEnv): any {
  if (isSym(x)) return env[x.name];
  else if (isNum(x)) return x.value;
  else if (isSymName(x[0], 'if')) {
    // @ts-ignore
    const [, test, conseq, alt] = x;
    const exp: Exp = evaluate(test, env) ? conseq : alt;
    return evaluate(exp, env);
  } else if (isSymName(x[0], 'define')) {
    // @ts-ignore
    const [, symbol, exp] = x;
    env[(symbol as Sym).name] = evaluate(exp, env);
    // side-effect?
  } else {
    const proc: Function = evaluate(x[0], env);
    // @ts-ignore
    const args = x.slice(1).map((v: any) => evaluate(v, env));
    return proc.apply(null, args);
  }
}

console.log(evaluate(parse('(begin (define r 10) (* pi (* r r)))')));
