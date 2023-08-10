/* eslint-disable class-methods-use-this */
// eslint-disable-next-line import/prefer-default-export
export class Aurora {
  constructor(config) {
    this.fen = config.fen;
    this.board = config.board;
    this.enPassant = '';

    // bitboards mask
    this.FILE_A = 0x8080808080808080n;
    this.FILE_H = 0x101010101010101n;
    this.FILE_AB = 0xc0c0c0c0c0c0c0c0n;
    this.FILE_GH = 0x303030303030303n;
    this.RANK_1 = 0xffn;
    this.RANK_4 = 0xff000000n;
    this.RANK_5 = 0xff00000000n;
    this.RANK_8 = 0xff00000000000000n;
    this.CENTER = 0x1818000000n;
    this.EXTENDED_CENTER = 0x3c3c3c3c0000n;
    this.KING_SIDE = 0x0f0f0f0f0f0f0f0fn;
    this.QUEEN_SIDE = 0xf0f0f0f0f0f0f0f0n;

    this.load(this.fen);
    this.getMoves();
  }

  load(fen) {
    // reset variables
    const bb = {
      wp: '',
      wr: '',
      wn: '',
      wb: '',
      wq: '',
      wk: '',
      bp: '',
      br: '',
      bn: '',
      bb: '',
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

    const bitboardsChar = {
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
    if (fenSplit[3] !== '-') this.enPassant = this.enPassantBitboard(fenSplit[3]);

    fenBoard.split('').forEach(char => {
      if (char !== '/') {
        if (Number(char)) {
          for (let i = 0; i < Number(char); i++) {
            bb.wp += '0';
            bb.wr += '0';
            bb.wn += '0';
            bb.wb += '0';
            bb.wq += '0';
            bb.wk += '0';
            bb.bp += '0';
            bb.br += '0';
            bb.bn += '0';
            bb.bb += '0';
            bb.bq += '0';
            bb.bk += '0';
          }
        } else {
          bb[bitboardsChar[char]] += '1';
          push0(bitboardsChar[char]);
        }
      }
    });

    this.wp = BigInt(`0b${bb.wp}`);
    this.wr = BigInt(`0b${bb.wr}`);
    this.wn = BigInt(`0b${bb.wn}`);
    this.wb = BigInt(`0b${bb.wb}`);
    this.wq = BigInt(`0b${bb.wq}`);
    this.wk = BigInt(`0b${bb.wk}`);
    this.bp = BigInt(`0b${bb.bp}`);
    this.br = BigInt(`0b${bb.br}`);
    this.bn = BigInt(`0b${bb.bn}`);
    this.bb = BigInt(`0b${bb.bb}`);
    this.bq = BigInt(`0b${bb.bq}`);
    this.bk = BigInt(`0b${bb.bk}`);
  }

  getMoves() {
    const moves = [];

    if (this.turn) {
      this.notWhitePieces = BigInt(
        ~(this.wp | this.wr | this.wn | this.wb | this.wq | this.wk | this.bk),
      );

      this.blackPieces = BigInt(
        this.bp | this.br | this.bn | this.bb | this.bq,
      );

      this.occupied = BigInt(
        this.wp |
          this.wr |
          this.wn |
          this.wb |
          this.wq |
          this.wk |
          this.bp |
          this.br |
          this.bn |
          this.bb |
          this.bq |
          this.bk,
      );

      this.empty = BigInt(~this.occupied);

      moves.push(...this.whitePawnsMoves());
      moves.push(...this.whiteRooksMoves());
    }

    console.log(moves);
    return moves;
  }

  whiteRooksMoves() {
    const moves = [];

    for (let i = 0; i < 64; i++) {
      if (this.wr & (1n << BigInt(i))) {
        const piece = 1n << BigInt(i);
        const left = this.occupied ^ (this.occupied - 2n * piece);
        const right =
          this.occupied ^
          this.reverseBits(
            this.reverseBits(this.occupied) - 2n * this.reverseBits(piece),
          );
        this.ascii(left);
        this.ascii(right);
      }
    }

    return moves;
  }

  whitePawnsMoves() {
    const moves = [];

    // pawn capture right
    const captureRightMoves =
      (this.wp << 7n) & this.blackPieces & ~this.RANK_8 & ~this.FILE_A;

    for (let i = 0; i < 64; i++) {
      if (captureRightMoves & (1n << BigInt(i))) {
        let mask = 1n << 7n;
        mask |= 1n;
        mask <<= BigInt(i) - 7n;
        moves.push({ mask, piece: 'wp' });
      }
    }

    // pawn capture left
    const captureLeftMoves =
      (this.wp << 9n) & this.blackPieces & ~this.RANK_8 & ~this.FILE_H;

    for (let i = 0; i < 64; i++) {
      if (captureLeftMoves & (1n << BigInt(i))) {
        let mask = 1n << 9n;
        mask |= 1n;
        mask <<= BigInt(i) - 9n;
        moves.push({ mask, piece: 'wp' });
      }
    }

    // pawn capture right en passant
    const captureRightEnPassantMoves =
      (this.wp >> 1n) & this.blackPieces & this.RANK_5 & ~this.FILE_A;

    for (let i = 0; i < 64; i++) {
      if (captureRightEnPassantMoves & (1n << BigInt(i))) {
        const enPassantMask = 1n << (BigInt(i) + 8n);
        if (enPassantMask === this.enPassant) {
          let mask = 1n << 7n;
          mask |= 1n;
          mask <<= BigInt(i) + 1n;
          moves.push({ mask, piece: 'wp', enPassant: enPassantMask });
        }
      }
    }

    // pawn capture left en passant
    const captureLeftEnPassantMoves =
      (this.wp << 1n) & this.blackPieces & this.RANK_5 & ~this.FILE_H;

    for (let i = 0; i < 64; i++) {
      if (captureLeftEnPassantMoves & (1n << BigInt(i))) {
        const enPassantMask = 1n << (BigInt(i) + 8n);
        if (enPassantMask === this.enPassant) {
          let mask = 1n << 9n;
          mask |= 1n;
          mask <<= BigInt(i) - 1n;
          moves.push({ mask, piece: 'wp', enPassant: enPassantMask });
        }
      }
    }

    // pawn move forward 1
    const forwardMoves = (this.wp << 8n) & this.empty & ~this.RANK_8;

    for (let i = 0; i < 64; i++) {
      if (forwardMoves & (1n << BigInt(i))) {
        let mask = 1n << 8n;
        mask |= 1n;
        mask <<= BigInt(i) - 8n;
        moves.push({ mask, piece: 'wp' });
      }
    }

    // pawn move forward 2
    const dblForwardMoves =
      (this.wp << 16n) & this.empty & (this.empty << 8n) & this.RANK_4;

    for (let i = 0; i < 64; i++) {
      if (dblForwardMoves & (1n << BigInt(i))) {
        let mask = 1n << 16n;
        mask |= 1n;
        mask <<= BigInt(i) - 16n;
        moves.push({ mask, piece: 'wp' });
      }
    }

    // pawn promotion

    // pawn capture right promotion
    const captureRightPromotionMoves =
      (this.wp << 7n) & this.blackPieces & this.RANK_8 & ~this.FILE_A;

    for (let i = 0; i < 64; i++) {
      if (captureRightPromotionMoves & (1n << BigInt(i))) {
        let mask = 1n << 7n;
        mask |= 1n;
        mask <<= BigInt(i) - 7n;

        const promotionMask = 1n << BigInt(i);

        moves.push({
          mask,
          piece: 'wp',
          promotion: { piece: 'wq', mask: promotionMask },
        });

        moves.push({
          mask,
          piece: 'wp',
          promotion: { piece: 'wn', mask: promotionMask },
        });

        moves.push({
          mask,
          piece: 'wp',
          promotion: { piece: 'wr', mask: promotionMask },
        });

        moves.push({
          mask,
          piece: 'wp',
          promotion: { piece: 'wb', mask: promotionMask },
        });
      }
    }

    // pawn capture left promotion
    const captureLeftPromotionMoves =
      (this.wp << 9n) & this.blackPieces & this.RANK_8 & ~this.FILE_H;

    for (let i = 0; i < 64; i++) {
      if (captureLeftPromotionMoves & (1n << BigInt(i))) {
        let mask = 1n << 9n;
        mask |= 1n;
        mask <<= BigInt(i) - 9n;

        const promotionMask = 1n << BigInt(i);

        moves.push({
          mask,
          piece: 'wp',
          promotion: { piece: 'wq', mask: promotionMask },
        });

        moves.push({
          mask,
          piece: 'wp',
          promotion: { piece: 'wn', mask: promotionMask },
        });

        moves.push({
          mask,
          piece: 'wp',
          promotion: { piece: 'wr', mask: promotionMask },
        });

        moves.push({
          mask,
          piece: 'wp',
          promotion: { piece: 'wb', mask: promotionMask },
        });
      }
    }

    // pawn move forward 1 promotion
    const forwardPromotionMoves = (this.wp << 8n) & this.empty & this.RANK_8;

    for (let i = 0; i < 64; i++) {
      if (forwardPromotionMoves & (1n << BigInt(i))) {
        let mask = 1n << 8n;
        mask |= 1n;
        mask <<= BigInt(i) - 8n;

        const promotionMask = 1n << BigInt(i);

        moves.push({
          mask,
          piece: 'wp',
          promotion: { piece: 'wq', mask: promotionMask },
        });

        moves.push({
          mask,
          piece: 'wp',
          promotion: { piece: 'wn', mask: promotionMask },
        });

        moves.push({
          mask,
          piece: 'wp',
          promotion: { piece: 'wr', mask: promotionMask },
        });

        moves.push({
          mask,
          piece: 'wp',
          promotion: { piece: 'wb', mask: promotionMask },
        });
      }
    }

    return moves;
  }

  enPassantBitboard(square) {
    const rankToIndex = {
      a: 7,
      b: 6,
      c: 5,
      d: 4,
      e: 3,
      f: 2,
      g: 1,
      h: 0,
    };

    const rank = square[0];
    const file = square[1];

    const index = rankToIndex[rank] + (file - 1) * 8;
    const mask = 1n << BigInt(index);
    return mask;
  }

  ascii(bitboard, text) {
    const board = [[], [], [], [], [], [], [], []];

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        board[rank][file] = 0;
      }
    }

    for (let i = 0; i < 64; i++) {
      if (BigInt(bitboard) & (1n << BigInt(63 - i))) {
        board[Math.floor(i / 8)][i % 8] = 'X';
      }
    }

    if (text) console.log(`${text} : \x1b[3m(table)\x1b[0m`);
    console.table(board);
  }

  reverseBits(num) {
    let result = 0n;

    while (num > 0n) {
      const bit = num & 1n;
      result = (result << 1n) | bit;

      num >>= 1n;
    }

    return result;
  }
}
