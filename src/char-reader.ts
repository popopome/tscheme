export interface ICharPos {
  pos: number;
  line: number;
  col: number;
}
export interface ICharReader {
  position(): ICharPos;
  current(): string;
  next(): string;
  seek(pos: number): void;
  getString(begin: ICharPos, end: ICharPos): string;
  getLineString(line: number): string;
}
export function makeCharReader(code: string): ICharReader {
  let pos = -1;
  let lines: number[] = [0];
  let col = 0;

  return {
    getLineString(line: number): string {
      if (line < lines.length) {
        const begin = lines[line];
        let end = line + 1 < lines.length ? lines[line + 1] : -1;
        if (end === -1) {
          end = begin;
          while (end < code.length) {
            if (code[end] === '\n') break;
            ++end;
          }
        }
        return code.substring(begin, end);
      }
      return '';
    },
    position() {
      return { pos, line: lines.length - 1, col };
    },
    current() {
      return code[pos];
    },
    next() {
      ++pos;
      if (pos >= code.length) return '';
      updateLineCol(pos);
      return this.current();
    },
    seek(position: number) {
      pos = position;
      for (let i = 0; i < lines.length; ++i) {
        if (pos < lines[i]) {
          lines.splice(0, i);
          updateLineCol(pos);
        }
      }
    },
    getString(begin: ICharPos, end: ICharPos) {
      return code.substring(begin.pos, end.pos);
    }
  };

  function updateLineCol(pos: number) {
    if (pos === 0) {
      lines = [0];
      col = 0;
    } else if (code[pos - 1] === '\n') {
      lines.push(pos);
      col = 0;
    } else {
      col = pos - lines[lines.length - 1];
    }
  }
}
