import { Sym } from './parse';
import { TokenType } from './tokenizer';

export interface Env {
  [k: string]: any;
}

function reduce<T>(ary: T[], f: (a: T, b: T) => T, init?: T) {
  return ary.reduce((acc, v) => (acc === undefined ? v : f(acc, v)), init);
}

function makeMathOp(f: (x: number, y: number) => number) {
  return (...args: number[]) => reduce(args, f);
}

export function makeEnv(): Env {
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
    ['number?']: (x: any): x is number =>
      Number.isFinite(x) || Number.isInteger(x),
    ['print']: (...args: any[]) => console.log(JSON.stringify(args)),
    ['procedure?']: (x: any): x is Function => typeof x === 'function',
    ['round']: Math.round,
    ['symbol?']: (x: any): x is Sym => {
      return x.type === TokenType.SYMBOL;
    }
  };
}
