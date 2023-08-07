/* eslint-disable class-methods-use-this */
// eslint-disable-next-line import/prefer-default-export
export class Aurora {
  constructor(config) {
    this.fen = config.fen;
    this.board = config.board;

    this.load(this.fen);
    this.ascii(this.bitboards.wp, 'white pawn');
  }

  load(fen) {
    // reset variables
    const bb = {
      wp: '',
      wr: '',
      wn: '',
      wb: '',
      wk: '',
      wq: '',
      bp: '',
      br: '',
      bb: '',
      bn: '',
      bq: '',
      bk: '',
    };
    this.side = 0;
    this.castle = 0;

    const push0 = char => {
      Object.keys(bb).forEach(key => {
        if (key !== char) {
          bb[key] += '0';
        }
      });
    };

    const bitboards = {
      P: 'wp',
      R: 'wr',
      B: 'wb',
      N: 'wn',
      Q: 'wq',
      K: 'wk',
      p: 'bp',
      r: 'br',
      n: 'bn',
      b: 'bb',
      q: 'bq',
      k: 'bk',
    };

    const fenSplit = fen.split(' ');
    const fenBoard = fenSplit[0];
    this.turn = fenSplit[1] === 'w' ? 1 : 0;

    fenBoard.split('').forEach(char => {
      if (char !== '/') {
        if (Number(char)) {
          for (let i = 0; i < Number(char); i++) {
            bb.wp += '0';
            bb.wr += '0';
            bb.wn += '0';
            bb.wb += '0';
            bb.wk += '0';
            bb.wq += '0';
            bb.bb += '0';
            bb.bp += '0';
            bb.bn += '0';
            bb.br += '0';
            bb.bq += '0';
            bb.bk += '0';
          }
        } else {
          bb[bitboards[char]] += '1';
          push0(bitboards[char]);
        }
      }
    });

    Object.keys(bb).forEach(key => {
      bb[key] = parseInt(bb[key], 2);
    });

    this.bitboards = bb;

    console.log('bitboards string', this.bitboards);
    console.log('bitboards type', typeof this.bitboards.wp);
    console.log('turn', this.turn);
  }

  ascii(bitboard, text) {
    const board = [[], [], [], [], [], [], [], []];

    for (let row = 0; row < 8; row++) {
      for (let file = 0; file < 8; file++) {
        board[row][file] = 0;
      }
    }

    for (let i = 0; i < 64; i++) {
      if (BigInt(bitboard) & (1n << BigInt(63 - i))) {
        board[Math.floor(i / 8)][i % 8] = 'X';
      }
    }

    console.log(`${text} : \x1b[3m(table)\x1b[0m`);
    console.table(board);
  }
}
