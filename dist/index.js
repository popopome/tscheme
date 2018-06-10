"use strict";
function tokenize(p) {
    return p
        .replace(/\(/g, ' ( ')
        .replace(/\)/g, ' ) ')
        .trim()
        .split(/\s+/);
}
const OPEN_PAR = '(';
const CLOSE_PAR = ')';
class Sym {
    constructor(name) {
        this.name = name;
    }
}
class Num {
    constructor(value) {
        this.value = value;
    }
}
function makeAST(tokens) {
    if (tokens.length === 0)
        throw new Error('unexpected EOF');
    let tok = tokens.shift();
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
function stringToNum(s) {
    const v = parseInt(s);
    if ('' + v === s)
        return v;
    const r = parseFloat(s);
    if ('' + r === s)
        return r;
    return undefined;
}
function makeAtom(tok) {
    const n = stringToNum(tok);
    return n !== undefined ? new Num(n) : new Sym(tok);
}
function parse(p) {
    return makeAST(tokenize(p));
}
console.log(parse(`
(a (b c) 
   (d e) 
   123
   (124.5)
   f)
`));
function reduce(ary, f, init) {
    return ary.reduce((acc, v) => (acc === undefined ? v : f(acc, v)), init);
}
function makeMathOp(f) {
    return (...args) => reduce(args, f);
}
function isSym(x) {
    return x instanceof Sym;
}
function isSymName(x, name) {
    return isSym(x) && x.name === name;
}
function isNum(x) {
    return x instanceof Num;
}
function makeEnv() {
    return {
        ['+']: makeMathOp((x, y) => x + y),
        ['-']: makeMathOp((x, y) => x - y),
        ['*']: makeMathOp((x, y) => x * y),
        ['/']: makeMathOp((x, y) => x / y),
        ['pi']: Math.PI,
        ['abs']: Math.abs,
        ['append']: (l, x) => {
            l.push(x);
            return l;
        },
        ['apply']: Function.prototype.apply,
        ['begin']: (...args) => args[args.length - 1],
        ['car']: (xs) => xs[0],
        ['cdr']: (xs) => xs.slice(1),
        ['cons']: (x, y) => [x, ...y],
        // TODO: is right?
        ['eq?']: (x, y) => x === y,
        ['expt']: Math.pow,
        ['equal?']: (x, y) => x === y,
        ['length']: (xs) => xs.length,
        ['list']: (...xs) => xs,
        // map:
        ['max']: Math.max,
        ['min']: Math.min,
        ['not']: (x) => !x,
        // TODO: right?
        ['null?']: (x) => x === [],
        ['number?']: (x) => Number.isFinite(x) || Number.isInteger(x),
        ['print']: (...args) => console.log(JSON.stringify(args)),
        ['procedure?']: (x) => typeof x === 'function',
        ['round']: Math.round,
        ['symbol?']: isSym
    };
}
const globalEnv = makeEnv();
function evaluate(x, env = globalEnv) {
    if (isSym(x))
        return env[x.name];
    else if (isNum(x))
        return x.value;
    else if (isSymName(x[0], 'if')) {
        // @ts-ignore
        const [, test, conseq, alt] = x;
        const exp = evaluate(test, env) ? conseq : alt;
        return evaluate(exp, env);
    }
    else if (isSymName(x[0], 'define')) {
        // @ts-ignore
        const [, symbol, exp] = x;
        env[symbol.name] = evaluate(exp, env);
        // side-effect?
    }
    else {
        const proc = evaluate(x[0], env);
        // @ts-ignore
        const args = x.slice(1).map((v) => evaluate(v, env));
        return proc.apply(null, args);
    }
}
console.log(evaluate(parse('(begin (define r 10) (* pi (* r r)))')));
