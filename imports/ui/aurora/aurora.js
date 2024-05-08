/* eslint-disable class-methods-use-this */
// eslint-disable-next-line import/prefer-default-export
export class Aurora {
  constructor(config) {
    this.fen = config.fen;
    this.board = config.board;
    this.color = config.color;
    this.autoplay = config.autoplay;
    this.enPassant = '';
    this.undoHistory = [];
    this.stage = 'MG';

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
    this.KNIGHT_SPAN = 0xa1100110an;
    this.KING_SPAN = 0x70507n;

    // material value
    this.PAWN_VALUE = 100;
    this.KNIGHT_VALUE = 350;
    this.BISHOP_VALUE = 355;
    this.ROOK_VALUE = 525;
    this.QUEEN_VALUE = 1000;
    this.BISHOP_PAIR_VALUE = 35;

    // white pieces square tables
    this.WHITE_PAWNS_SQUARE_TABLE = [
      { mask: 0xff000000000000n, score: 50 },
      { mask: 0x180000000000n, score: 30 },
      { mask: 0x1800000000n, score: 25 },
      { mask: 0x240018000000n, score: 20 },
      { mask: 0xc32400006600n, score: 10 },
      { mask: 0xc300818100n, score: 5 },
      { mask: 0x420000n, score: -5 },
      { mask: 0x240000n, score: -10 },
      { mask: 0x1800n, score: -20 },
    ];
    this.WHITE_KNIGHTS_SQUARE_TABLE = [
      { mask: 0x1818000000n, score: 20 },
      { mask: 0x182424180000n, score: 15 },
      { mask: 0x240000240000n, score: 10 },
      { mask: 0x4200421800n, score: 5 },
      { mask: 0x42000000004200n, score: -20 },
      { mask: 0x3c0081818181003cn, score: -30 },
      { mask: 0x4281000000008142n, score: -40 },
      { mask: 0x8100000000000081n, score: -50 },
    ];
    this.WHITE_BISHOPS_SQUARE_TABLE = [
      { mask: 0x18183c7e0000n, score: 10 },
      { mask: 0x246600004200n, score: 5 },
      { mask: 0x7e8181818181817en, score: -10 },
      { mask: 0x8100000000000081n, score: -20 },
    ];
    this.WHITE_ROOKS_SQUARE_TABLE = [
      { mask: 0x7e000000000000n, score: 10 },
      { mask: 0x81000000000018n, score: 5 },
      { mask: 0x818181818100n, score: -5 },
    ];
    this.WHITE_QUEENS_SQUARE_TABLE = [
      { mask: 0x3c3c3c7c2000n, score: 5 },
      { mask: 0x1800008101000018n, score: -5 },
      { mask: 0x6681810000818166n, score: -10 },
      { mask: 0x8100000000000081n, score: -20 },
    ];
    this.MG_WHITE_KING_SQUARE_TABLE = [
      { mask: 0x42n, score: 30 },
      { mask: 0xc381n, score: 20 },
      { mask: 0x24n, score: 10 },
      { mask: 0x810000n, score: -10 },
      { mask: 0x817e0000n, score: -20 },
      { mask: 0x8181818166000000n, score: -30 },
      { mask: 0x6666666618000000n, score: -40 },
      { mask: 0x1818181800000000n, score: -50 },
    ];
    this.EG_WHITE_KING_SQUARE_TABLE = [
      { mask: 0x1818000000n, score: 40 },
      { mask: 0x182424180000n, score: 30 },
      { mask: 0x240000240000n, score: 20 },
      { mask: 0x24424242420000n, score: -10 },
      { mask: 0x1842000000000000n, score: -20 },
      { mask: 0x248181818181c37en, score: -30 },
      { mask: 0x4200000000000000n, score: -40 },
      { mask: 0x8100000000000081n, score: -50 },
    ];

    // this.ascii();

    this.load(this.fen);

    if (this.color) {
      this.board.flip();
      this.makeMove();
    }

    // console.log(this.evaluate());

    // last : ~230ms
    // console.time('Evaluation');
    // for (let i = 0; i < 10000; i++) {
    //   this.evaluate();
    // }
    // console.timeEnd('Evaluation');
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

    // turn
    this.turn = fenSplit[1] === 'w';

    // castling rights
    if (fenSplit[2] !== '-') {
      this.castlingRights = fenSplit[2].split('');
    } else this.castlingRights = [];

    // en passant
    if (fenSplit[3] !== '-') this.enPassant = this.squareBitboard(fenSplit[3]);

    // fen
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

  makeMove(depth) {
    const self = this;

    function minimax(currentDepth, alpha, beta) {
      if (currentDepth === 0) {
        return self.evaluate();
      }

      const moves = self.getMoves();

      if (moves.length === 0) {
        if (self.playerInCheck()) {
          return Number.NEGATIVE_INFINITY;
        }
        return 0;
      }

      for (let i = 0; i < moves.length; i++) {
        self.playMove(moves[i]);
        const evaluation = -minimax(currentDepth - 1, -beta, -alpha);
        self.undoMove();
        if (evaluation >= beta) {
          return beta;
        }
        alpha = Math.max(alpha, evaluation);
      }

      return alpha;
    }

    const moves = this.getMoves();
    const movesEvaluated = [];

    for (let i = 0; i < moves.length; i++) {
      this.playMove(moves[i]);
      movesEvaluated.push([
        moves[i],
        -minimax(depth - 1, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY),
      ]);
      this.undoMove();
    }

    const bestEval = movesEvaluated.reduce(
      (max, move) => Math.max(max, move[1]),
      -Infinity,
    );

    const bestMoves = movesEvaluated.filter(move => move[1] === bestEval);

    if (bestMoves.length > 1) {
      this.playMove(bestMoves[Math.floor(Math.random() * bestMoves.length)][0]);
    } else this.playMove(bestMoves[0][0]);
  }

  playerInCheck() {
    return false;
  }

  playMove(move) {
    // update the bitboard of the piece that play
    this[move.piece] ^= move.mask;
    const undo = move;
    undo.castlingRights = [];

    // switch turn
    this.turn = !this.turn;

    // check if move is a capture to update the capture piece's bitboard (remove the piece)
    if (move.capture && !move.capture.mask) {
      if (this.turn) this.captureWhitePiece(move.capture, undo);
      else this.captureBlackPiece(move.capture, undo);
    }

    // pawn promotion
    if (move.promotion) {
      this[move.piece] ^= move.promotion.mask;
      this[move.promotion.piece] |= move.promotion.mask;
    }

    // check if a rook is capture to remove castle on its side
    if (move.capture && move.capture.piece === 'wr') {
      if (move.capture.mask === 1n) {
        const kingIndex = this.castlingRights.indexOf('K');
        if (kingIndex !== -1) {
          this.castlingRights.splice(kingIndex, 1);
          undo.castlingRights.push('K');
        }
      } else if (move.capture.mask === 0x80n) {
        const queenIndex = this.castlingRights.indexOf('Q');
        if (queenIndex !== -1) {
          this.castlingRights.splice(queenIndex, 1);
          undo.castlingRights.push('Q');
        }
      }
    } else if (move.capture && move.capture.piece === 'br') {
      if (move.capture.mask === 0x100000000000000n) {
        const kingIndex = this.castlingRights.indexOf('k');
        if (kingIndex !== -1) {
          this.castlingRights.splice(kingIndex, 1);
          undo.castlingRights.push('k');
        }
      } else if (move.capture.mask === 0x800000000000000n) {
        const queenIndex = this.castlingRights.indexOf('q');
        if (queenIndex !== -1) {
          this.castlingRights.splice(queenIndex, 1);
          undo.castlingRights.push('q');
        }
      }
    }

    // disable castle after a rook move (on his side)
    if (move.piece === 'wr') {
      if (move.mask & 1n) {
        const kingIndex = this.castlingRights.indexOf('K');
        if (kingIndex !== -1) {
          this.castlingRights.splice(kingIndex, 1);
          undo.castlingRights.push('K');
        }
      } else if (move.mask & 0x80n) {
        const queenIndex = this.castlingRights.indexOf('Q');
        if (queenIndex !== -1) {
          this.castlingRights.splice(queenIndex, 1);
          undo.castlingRights.push('Q');
        }
      }
    } else if (move.piece === 'br') {
      if (move.mask & 0x100000000000000n) {
        const kingIndex = this.castlingRights.indexOf('k');
        if (kingIndex !== -1) {
          this.castlingRights.splice(kingIndex, 1);
          undo.castlingRights.push('k');
        }
      } else if (move.mask & 0x8000000000000000n) {
        const queenIndex = this.castlingRights.indexOf('q');
        if (queenIndex !== -1) {
          this.castlingRights.splice(queenIndex, 1);
          undo.castlingRights.push('q');
        }
      }
    }

    // disable castling after kings move
    if (move.piece === 'wk') {
      const kingIndex = this.castlingRights.indexOf('K');
      if (kingIndex !== -1) {
        undo.castlingRights.push('K');
        this.castlingRights.splice(kingIndex, 1);
      }

      const queenIndex = this.castlingRights.indexOf('Q');
      if (queenIndex !== -1) {
        undo.castlingRights.push('Q');
        this.castlingRights.splice(queenIndex, 1);
      }
    } else if (move.piece === 'bk') {
      const kingIndex = this.castlingRights.indexOf('k');
      if (kingIndex !== -1) {
        undo.castlingRights.push('k');
        this.castlingRights.splice(kingIndex, 1);
      }

      const queenIndex = this.castlingRights.indexOf('q');
      if (queenIndex !== -1) {
        undo.castlingRights.push('q');
        this.castlingRights.splice(queenIndex, 1);
      }
    }

    // update rook bitboard after a castle
    if (move.castle) {
      this[move.castle.piece] ^= move.castle.mask;
    }

    // update pawn bitboard after en passant capture
    if (move.enPassant) {
      if (this.turn) this.wp ^= move.enPassant << 8n;
      else this.bp ^= move.enPassant >> 8n;
    }

    // enable en passant capture on a pawn after he moves forward by two
    if (move.enableEnPassant) {
      this.enPassant = move.enableEnPassant;
    } else {
      this.enPassant = null;
    }

    // check et change le game stage
    if (move.capture && this.stage !== 'EG') {
      this.checkGameStage();
    }

    this.undoHistory.unshift(undo);
  }

  captureBlackPiece(piece, undo) {
    const capture = { mask: piece };
    if (this.bp & piece) {
      this.bp ^= piece;
      capture.piece = 'bp';
    } else if (this.bn & piece) {
      this.bn ^= piece;
      capture.piece = 'bn';
    } else if (this.bb & piece) {
      this.bb ^= piece;
      capture.piece = 'bb';
    } else if (this.br & piece) {
      this.br ^= piece;
      capture.piece = 'br';
    } else if (this.bq & piece) {
      this.bq ^= piece;
      capture.piece = 'bq';
    }
    undo.capture = capture;
  }

  captureWhitePiece(piece, undo) {
    const capture = { mask: piece };
    if (this.wp & piece) {
      this.wp ^= piece;
      capture.piece = 'wp';
    } else if (this.wn & piece) {
      this.wn ^= piece;
      capture.piece = 'wn';
    } else if (this.wb & piece) {
      this.wb ^= piece;
      capture.piece = 'wb';
    } else if (this.wr & piece) {
      this.wr ^= piece;
      capture.piece = 'wr';
    } else if (this.wq & piece) {
      this.wq ^= piece;
      capture.piece = 'wq';
    }
    undo.capture = capture;
  }

  evaluate() {
    // material
    let white = this.numberOfOnes(this.wp) * this.PAWN_VALUE;
    white += this.numberOfOnes(this.wr) * this.ROOK_VALUE;
    white += this.numberOfOnes(this.wn) * this.KNIGHT_VALUE;
    white += this.numberOfOnes(this.wb) * this.BISHOP_VALUE;
    white += this.numberOfOnes(this.wq) * this.QUEEN_VALUE;

    let black = this.numberOfOnes(this.bp) * this.PAWN_VALUE;
    black += this.numberOfOnes(this.br) * this.ROOK_VALUE;
    black += this.numberOfOnes(this.bn) * this.KNIGHT_VALUE;
    black += this.numberOfOnes(this.bb) * this.BISHOP_VALUE;
    black += this.numberOfOnes(this.bq) * this.QUEEN_VALUE;

    const materialDiff = white - black;

    // bishop pair bonus
    const whiteBishopPair =
      this.numberOfOnes(this.wb) === 2 ? this.BISHOP_PAIR_VALUE : 0;
    const blackBishopPair =
      this.numberOfOnes(this.wb) === 2 ? -this.BISHOP_PAIR_VALUE : 0;

    // white pieces square table bonus
    this.evaluateSquareTable(this.WHITE_PAWNS_SQUARE_TABLE, 'wp');
    this.evaluateSquareTable(this.WHITE_KNIGHTS_SQUARE_TABLE, 'wn');
    this.evaluateSquareTable(this.WHITE_BISHOPS_SQUARE_TABLE, 'wb');
    this.evaluateSquareTable(this.WHITE_QUEENS_SQUARE_TABLE, 'wq');
    this.evaluateSquareTable(
      this[`${this.stage}_WHITE_KING_SQUARE_TABLE`],
      'wk',
    );

    const persperctive = this.turn ? 1 : -1;

    return (materialDiff + whiteBishopPair + blackBishopPair) * persperctive;
  }

  evaluateSquareTable(squareTable, piece) {
    // ? break la loupe des tables si tout les pieces du bb ont été trouvés

    let score = 0;
    squareTable.forEach(table => {
      score += this.numberOfOnes(this[piece] & table.mask) * table.score;
    });

    // ? ↓ //
    // let score = 0;
    // const pieces = this.numberOfOnes(this[piece]);
    // let discover = 0;
    // for (let i = 0; i < squareTable.length; i++) {
    //   const point =
    //     this.numberOfOnes(this[piece] & squareTable[i].mask) *
    //     squareTable[i].score;

    //   if (point) {
    //     score += point;
    //     discover += 1;
    //     if (discover === pieces) break;
    //   }
    // }

    // console.log(`${piece} points square table`, score);

    return score;
  }

  undoMove() {
    const move = this.undoHistory[0];
    this[move.piece] ^= move.mask;

    if (move.promotion) {
      this[move.piece] ^= move.promotion.mask;
      this[move.promotion.piece] ^= move.promotion.mask;
    }

    if (move.capture) {
      this[move.capture.piece] |= move.capture.mask;
    }

    if (move.castlingRights.length !== 0) {
      this.castlingRights.push(...move.castlingRights);
    }

    if (move.castle) {
      this[move.castle.piece] ^= move.castle.mask;
    }

    if (move.enPassant) {
      if (this.turn) this.wp |= move.enPassant << 8n;
      else this.bp |= move.enPassant >> 8n;

      this.enPassant = move.enPassant;
    } else this.enPassant = null;

    this.undoHistory.shift();
    this.turn = !this.turn;
  }

  isLegalMove(source, target) {
    const moves = this.getMoves();
    const moveMask = this.squareBitboard(source) | this.squareBitboard(target);

    let legalMove = moves.find(move => move.mask === moveMask);
    if (legalMove && legalMove.promotion) {
      if (this.shiftKey) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          // eslint-disable-next-line no-alert
          const userPiece = prompt('\'Q\', \'N\', \'R\', \'B\'').toLocaleLowerCase();
          if (
            userPiece === 'q' ||
            userPiece === 'n' ||
            userPiece === 'r' ||
            userPiece === 'b'
          ) {
            legalMove = moves.find(
              move => move.promotion &&
                move.promotion.piece[1] === userPiece &&
                move.mask === moveMask,
            );
            break;
          }
        }
      } else {
        legalMove = moves.find(
          move => move.promotion &&
            move.promotion.piece[1] === 'q' &&
            move.mask === moveMask,
        );
      }
    }

    if (
      legalMove &&
      (this[legalMove.piece] & this.squareBitboard(source)) === 0n
    ) {
      return false;
    }

    return legalMove;
  }

  unsafeForWhite() {
    const occupied = BigInt(
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

    // Pawn attacks
    let unsafe = (this.bp >> 7n) & ~this.FILE_H; // pawn capture left
    unsafe |= (this.bp >> 9n) & ~this.FILE_A; // pawn capture right

    // Knights attacks
    let loop = this.bn;
    let piece = loop & ~(loop - 1n);
    let knightAttacks;
    while (piece !== 0n) {
      const i = this.numberOfTrailingZeros(piece);

      if (i > 18) {
        knightAttacks = this.KNIGHT_SPAN << BigInt(i - 18);
      } else {
        knightAttacks = this.KNIGHT_SPAN >> BigInt(18 - i);
      }

      if (piece & this.FILE_AB) knightAttacks &= ~this.FILE_GH;
      else if (piece & this.FILE_GH) knightAttacks &= ~this.FILE_AB;

      unsafe |= knightAttacks;
      // loop
      loop ^= piece;
      piece = loop & ~(loop - 1n);
    }

    // Queens and Bishops diagonal and antidiagonal attacks
    loop = this.bq | this.bb;
    piece = loop & ~(loop - 1n);
    let diagonalsAttacks;
    while (piece !== 0n) {
      diagonalsAttacks = this.southWestMask(piece);
      let blockers = occupied & diagonalsAttacks;
      if (blockers) {
        const square = this.msb(blockers);
        diagonalsAttacks ^= this.southWestMask(square);
      }
      unsafe |= diagonalsAttacks;

      diagonalsAttacks = this.southEastMask(piece);
      blockers = occupied & diagonalsAttacks;
      if (blockers) {
        const square = this.msb(blockers);
        diagonalsAttacks ^= this.southEastMask(square);
      }
      unsafe |= diagonalsAttacks;

      diagonalsAttacks = this.northWestMask(piece);
      blockers = occupied & diagonalsAttacks;
      if (blockers) {
        const square = this.lsb(blockers);
        diagonalsAttacks ^= this.northWestMask(square);
      }
      unsafe |= diagonalsAttacks;

      diagonalsAttacks = this.northEastMask(piece);
      blockers = occupied & diagonalsAttacks;
      if (blockers) {
        const square = this.lsb(blockers);
        diagonalsAttacks ^= this.northEastMask(square);
      }
      unsafe |= diagonalsAttacks;

      // loop
      loop &= ~piece;
      piece = loop & ~(loop - 1n);
    }

    // Queens and Rooks horizontal and vertical attacks
    loop = this.bq | this.br;
    piece = loop & ~(loop - 1n);
    let filesAttacks;
    while (piece !== 0n) {
      filesAttacks = this.southMask(piece);
      let blockers = occupied & filesAttacks;
      if (blockers) {
        const square = this.msb(blockers);
        filesAttacks ^= this.southMask(square);
      }
      unsafe |= filesAttacks;

      filesAttacks = this.westMask(piece);
      blockers = occupied & filesAttacks;
      if (blockers) {
        const square = this.lsb(blockers);
        filesAttacks ^= this.westMask(square);
      }
      unsafe |= filesAttacks;

      filesAttacks = this.northMask(piece);
      blockers = occupied & filesAttacks;
      if (blockers) {
        const square = this.lsb(blockers);
        filesAttacks ^= this.northMask(square);
      }
      unsafe |= filesAttacks;

      filesAttacks = this.eastMask(piece);
      blockers = occupied & filesAttacks;
      if (blockers) {
        const square = this.msb(blockers);
        filesAttacks ^= this.eastMask(square);
      }
      unsafe |= filesAttacks;

      // loop
      loop &= ~piece;
      piece = loop & ~(loop - 1n);
    }

    // King attacks
    loop = this.bk;
    piece = loop & ~(loop - 1n);
    let kingAttacks;
    while (piece !== 0n) {
      const i = this.numberOfTrailingZeros(piece);

      if (i > 9) {
        kingAttacks = this.KING_SPAN << BigInt(i - 9);
      } else {
        kingAttacks = this.KING_SPAN >> BigInt(9 - i);
      }

      if (piece & this.FILE_A) kingAttacks &= ~this.FILE_H;
      else if (piece & this.FILE_H) kingAttacks &= ~this.FILE_A;

      unsafe |= kingAttacks;
      // loop
      loop &= ~piece;
      piece = loop & ~(loop - 1n);
    }

    return unsafe;
  }

  unsafeForBlack() {
    const occupied = BigInt(
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

    // // Pawn attacks
    let unsafe = (this.wp << 7n) & ~this.FILE_A; // pawn capture left
    unsafe |= (this.wp << 9n) & ~this.FILE_H; // pawn capture right

    // Knights attacks
    let loop = this.wn;
    let piece = loop & ~(loop - 1n);
    let knightAttacks;
    while (piece !== 0n) {
      const i = this.numberOfTrailingZeros(piece);

      if (i > 18) {
        knightAttacks = this.KNIGHT_SPAN << BigInt(i - 18);
      } else {
        knightAttacks = this.KNIGHT_SPAN >> BigInt(18 - i);
      }

      if (piece & this.FILE_AB) knightAttacks &= ~this.FILE_GH;
      else if (piece & this.FILE_GH) knightAttacks &= ~this.FILE_AB;

      unsafe |= knightAttacks;
      // loop
      loop ^= piece;
      piece = loop & ~(loop - 1n);
    }

    // Queens and Bishops diagonal and antidiagonal attacks
    loop = this.wq | this.wb;
    piece = loop & ~(loop - 1n);
    let diagonalsAttacks;
    while (piece !== 0n) {
      diagonalsAttacks = this.southWestMask(piece);
      let blockers = occupied & diagonalsAttacks;
      if (blockers) {
        const square = this.msb(blockers);
        diagonalsAttacks ^= this.southWestMask(square);
      }
      unsafe |= diagonalsAttacks;

      diagonalsAttacks = this.southEastMask(piece);
      blockers = occupied & diagonalsAttacks;
      if (blockers) {
        const square = this.msb(blockers);
        diagonalsAttacks ^= this.southEastMask(square);
      }
      unsafe |= diagonalsAttacks;

      diagonalsAttacks = this.northWestMask(piece);
      blockers = occupied & diagonalsAttacks;
      if (blockers) {
        const square = this.lsb(blockers);
        diagonalsAttacks ^= this.northWestMask(square);
      }
      unsafe |= diagonalsAttacks;

      diagonalsAttacks = this.northEastMask(piece);
      blockers = occupied & diagonalsAttacks;
      if (blockers) {
        const square = this.lsb(blockers);
        diagonalsAttacks ^= this.northEastMask(square);
      }
      unsafe |= diagonalsAttacks;

      // loop
      loop &= ~piece;
      piece = loop & ~(loop - 1n);
    }

    // Queens and Rooks horizontal and vertical attacks
    loop = this.wq | this.wr;
    piece = loop & ~(loop - 1n);
    let filesAttacks;
    while (piece !== 0n) {
      filesAttacks = this.southMask(piece);
      let blockers = occupied & filesAttacks;
      if (blockers) {
        const square = this.msb(blockers);
        filesAttacks ^= this.southMask(square);
      }
      unsafe |= filesAttacks;

      filesAttacks = this.westMask(piece);
      blockers = occupied & filesAttacks;
      if (blockers) {
        const square = this.lsb(blockers);
        filesAttacks ^= this.westMask(square);
      }
      unsafe |= filesAttacks;

      filesAttacks = this.northMask(piece);
      blockers = occupied & filesAttacks;
      if (blockers) {
        const square = this.lsb(blockers);
        filesAttacks ^= this.northMask(square);
      }
      unsafe |= filesAttacks;

      filesAttacks = this.eastMask(piece);
      blockers = occupied & filesAttacks;
      if (blockers) {
        const square = this.msb(blockers);
        filesAttacks ^= this.eastMask(square);
      }
      unsafe |= filesAttacks;

      // loop
      loop &= ~piece;
      piece = loop & ~(loop - 1n);
    }

    // King attacks
    loop = this.wk;
    piece = loop & ~(loop - 1n);
    let kingAttacks;
    while (piece !== 0n) {
      const i = this.numberOfTrailingZeros(piece);

      if (i > 9) {
        kingAttacks = this.KING_SPAN << BigInt(i - 9);
      } else {
        kingAttacks = this.KING_SPAN >> BigInt(9 - i);
      }

      if (piece & this.FILE_A) kingAttacks &= ~this.FILE_H;
      else if (piece & this.FILE_H) kingAttacks &= ~this.FILE_A;

      unsafe |= kingAttacks;
      // loop
      loop &= ~piece;
      piece = loop & ~(loop - 1n);
    }

    return unsafe;
  }

  getMoves() {
    const moves = [];

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

    if (this.turn) {
      // WHITE TO MOVE

      this.notWhitePieces = BigInt(
        ~(this.wp | this.wr | this.wn | this.wb | this.wq | this.wk | this.bk),
      );

      this.blackPieces = BigInt(
        this.bp | this.br | this.bn | this.bb | this.bq,
      );

      moves.push(...this.whitePawnsMoves());
      moves.push(
        ...this.knightsMoves('wn', this.notWhitePieces, this.blackPieces),
      );
      moves.push(
        ...this.kingsMoves('wk', this.notWhitePieces, this.blackPieces),
      );
      moves.push(
        ...this.rooksMoves('wr', this.notWhitePieces, this.blackPieces),
      );
      moves.push(
        ...this.bishopsMoves('wb', this.notWhitePieces, this.blackPieces),
      );
      moves.push(
        ...this.queensMoves('wq', this.notWhitePieces, this.blackPieces),
      );
      moves.push(...this.whiteCastlesMoves());
    } else {
      // BLACK TO MOVE

      this.notBlackPieces = BigInt(
        ~(this.bp | this.br | this.bn | this.bb | this.bq | this.bk | this.wk),
      );

      this.whitePieces = BigInt(
        this.wp | this.wr | this.wn | this.wb | this.wq,
      );

      moves.push(...this.blackPawnsMoves());
      moves.push(
        ...this.knightsMoves('bn', this.notBlackPieces, this.whitePieces),
      );
      moves.push(
        ...this.kingsMoves('bk', this.notBlackPieces, this.whitePieces),
      );
      moves.push(
        ...this.rooksMoves('br', this.notBlackPieces, this.whitePieces),
      );
      moves.push(
        ...this.bishopsMoves('bb', this.notBlackPieces, this.whitePieces),
      );
      moves.push(
        ...this.queensMoves('bq', this.notBlackPieces, this.whitePieces),
      );
      moves.push(...this.blackCastlesMoves());
    }

    // console.log(moves);
    return moves;
  }

  queensMoves(type, notMyPieces, oppPieces) {
    const moves = [];

    moves.push(...this.eastMoves(type, notMyPieces, oppPieces)); // East Moves for all type pieces
    moves.push(...this.northMoves(type, notMyPieces, oppPieces)); // North Moves for all type pieces
    moves.push(...this.westMoves(type, notMyPieces, oppPieces)); // West Moves for all type pieces
    moves.push(...this.southMoves(type, notMyPieces, oppPieces)); // South Moves for all type pieces

    moves.push(...this.northEastMoves(type, notMyPieces, oppPieces)); // North East Moves for all type pieces
    moves.push(...this.northWestMoves(type, notMyPieces, oppPieces)); // North West Moves for all type pieces
    moves.push(...this.southEastMoves(type, notMyPieces, oppPieces)); // South East Moves for all type pieces
    moves.push(...this.southWestMoves(type, notMyPieces, oppPieces)); // South West Moves for all type pieces

    return moves;
  }

  bishopsMoves(type, notMyPieces, oppPieces) {
    const moves = [];

    moves.push(...this.northEastMoves(type, notMyPieces, oppPieces)); // North East Moves for all type pieces
    moves.push(...this.northWestMoves(type, notMyPieces, oppPieces)); // North West Moves for all type pieces
    moves.push(...this.southEastMoves(type, notMyPieces, oppPieces)); // South East Moves for all type pieces
    moves.push(...this.southWestMoves(type, notMyPieces, oppPieces)); // South West Moves for all type pieces

    return moves;
  }

  rooksMoves(type, notMyPieces, oppPieces) {
    const moves = [];

    moves.push(...this.eastMoves(type, notMyPieces, oppPieces)); // East Moves for all type pieces
    moves.push(...this.northMoves(type, notMyPieces, oppPieces)); // North Moves for all type pieces
    moves.push(...this.westMoves(type, notMyPieces, oppPieces)); // West Moves for all type pieces
    moves.push(...this.southMoves(type, notMyPieces, oppPieces)); // South Moves for all type pieces

    return moves;
  }

  southWestMoves(type, notMyPieces, oppPieces) {
    const moves = [];

    for (let i = 0; i < 64; i++) {
      if (this[type] & (1n << BigInt(i))) {
        const piece = 1n << BigInt(i);
        let attacks = this.southWestMask(piece);
        const blockers = this.occupied & attacks;
        if (blockers) {
          const square = this.msb(blockers);
          attacks ^= this.southWestMask(square);
        }

        for (let j = 0; j < 64; j++) {
          if (attacks & (1n << BigInt(j))) {
            const target = 1n << BigInt(j);
            if (target & notMyPieces) {
              const move = { mask: piece | target, piece: type };
              if (target & oppPieces) {
                move.capture = target;
              }
              moves.push(move);
            }
          }
        }
      }
    }

    return moves;
  }

  southEastMoves(type, notMyPieces, oppPieces) {
    const moves = [];

    for (let i = 0; i < 64; i++) {
      if (this[type] & (1n << BigInt(i))) {
        const piece = 1n << BigInt(i);
        let attacks = this.southEastMask(piece);
        const blockers = this.occupied & attacks;
        if (blockers) {
          const square = this.msb(blockers);
          attacks ^= this.southEastMask(square);
        }

        for (let j = 0; j < 64; j++) {
          if (attacks & (1n << BigInt(j))) {
            const target = 1n << BigInt(j);
            if (target & notMyPieces) {
              const move = { mask: piece | target, piece: type };
              if (target & oppPieces) {
                move.capture = target;
              }
              moves.push(move);
            }
          }
        }
      }
    }

    return moves;
  }

  northWestMoves(type, notMyPieces, oppPieces) {
    const moves = [];

    for (let i = 0; i < 64; i++) {
      if (this[type] & (1n << BigInt(i))) {
        const piece = 1n << BigInt(i);
        let attacks = this.northWestMask(piece);
        const blockers = this.occupied & attacks;
        if (blockers) {
          const square = this.lsb(blockers);
          attacks ^= this.northWestMask(square);
        }

        for (let j = 0; j < 64; j++) {
          if (attacks & (1n << BigInt(j))) {
            const target = 1n << BigInt(j);
            if (target & notMyPieces) {
              const move = { mask: piece | target, piece: type };
              if (target & oppPieces) {
                move.capture = target;
              }
              moves.push(move);
            }
          }
        }
      }
    }

    return moves;
  }

  northEastMoves(type, notMyPieces, oppPieces) {
    const moves = [];

    for (let i = 0; i < 64; i++) {
      if (this[type] & (1n << BigInt(i))) {
        const piece = 1n << BigInt(i);
        let attacks = this.northEastMask(piece);
        const blockers = this.occupied & attacks;
        if (blockers) {
          const square = this.lsb(blockers);
          attacks ^= this.northEastMask(square);
        }

        for (let j = 0; j < 64; j++) {
          if (attacks & (1n << BigInt(j))) {
            const target = 1n << BigInt(j);
            if (target & notMyPieces) {
              const move = { mask: piece | target, piece: type };
              if (target & oppPieces) {
                move.capture = target;
              }
              moves.push(move);
            }
          }
        }
      }
    }

    return moves;
  }

  southMoves(type, notMyPieces, oppPieces) {
    const moves = [];

    for (let i = 0; i < 64; i++) {
      if (this[type] & (1n << BigInt(i))) {
        const piece = 1n << BigInt(i);
        let attacks = this.southMask(piece);
        const blockers = this.occupied & attacks;
        if (blockers) {
          const square = this.msb(blockers);
          attacks ^= this.southMask(square);
        }

        for (let j = 0; j < 64; j++) {
          if (attacks & (1n << BigInt(j))) {
            const target = 1n << BigInt(j);
            if (target & notMyPieces) {
              const move = { mask: piece | target, piece: type };
              if (target & oppPieces) {
                move.capture = target;
              }
              moves.push(move);
            }
          }
        }
      }
    }

    return moves;
  }

  westMoves(type, notMyPieces, oppPieces) {
    const moves = [];

    for (let i = 0; i < 64; i++) {
      if (this[type] & (1n << BigInt(i))) {
        const piece = 1n << BigInt(i);
        let attacks = this.westMask(piece);
        const blockers = this.occupied & attacks;
        if (blockers) {
          const square = this.lsb(blockers);
          attacks ^= this.westMask(square);
        }

        for (let j = 0; j < 64; j++) {
          if (attacks & (1n << BigInt(j))) {
            const target = 1n << BigInt(j);
            if (target & notMyPieces) {
              const move = { mask: piece | target, piece: type };
              if (target & oppPieces) {
                move.capture = target;
              }
              moves.push(move);
            }
          }
        }
      }
    }

    return moves;
  }

  northMoves(type, notMyPieces, oppPieces) {
    const moves = [];

    for (let i = 0; i < 64; i++) {
      if (this[type] & (1n << BigInt(i))) {
        const piece = 1n << BigInt(i);
        let attacks = this.northMask(piece);
        const blockers = this.occupied & attacks;
        if (blockers) {
          const square = this.lsb(blockers);
          attacks ^= this.northMask(square);
        }

        for (let j = 0; j < 64; j++) {
          if (attacks & (1n << BigInt(j))) {
            const target = 1n << BigInt(j);
            if (target & notMyPieces) {
              const move = { mask: piece | target, piece: type };
              if (target & oppPieces) {
                move.capture = target;
              }
              moves.push(move);
            }
          }
        }
      }
    }

    return moves;
  }

  eastMoves(type, notMyPieces, oppPieces) {
    const moves = [];

    for (let i = 0; i < 64; i++) {
      if (this[type] & (1n << BigInt(i))) {
        const piece = 1n << BigInt(i);
        let attacks = this.eastMask(piece);
        const blockers = this.occupied & attacks;
        if (blockers) {
          const square = this.msb(blockers);
          attacks ^= this.eastMask(square);
        }

        for (let j = 0; j < 64; j++) {
          if (attacks & (1n << BigInt(j))) {
            const target = 1n << BigInt(j);
            if (target & notMyPieces) {
              const move = { mask: piece | target, piece: type };
              if (target & oppPieces) {
                move.capture = target;
              }
              moves.push(move);
            }
          }
        }
      }
    }

    return moves;
  }

  southWestMask(piece) {
    let mask = 0n;

    for (let i = 1n; i <= 7n; i++) {
      if ((piece >> (i * 7n)) & ~this.FILE_H) {
        mask |= piece >> (i * 7n);
      } else break;
    }

    return mask;
  }

  southEastMask(piece) {
    let mask = 0n;

    for (let i = 1n; i <= 7n; i++) {
      if ((piece >> (i * 9n)) & ~this.FILE_A) {
        mask |= piece >> (i * 9n);
      } else break;
    }

    return mask;
  }

  northWestMask(piece) {
    let mask = 0n;

    for (let i = 1n; i <= 7n; i++) {
      if ((piece << (i * 9n)) & ~this.FILE_H) {
        mask |= piece << (i * 9n);
      } else break;
    }

    return mask;
  }

  northEastMask(piece) {
    let mask = 0n;

    for (let i = 1n; i <= 7n; i++) {
      if ((piece << (i * 7n)) & ~this.FILE_A) {
        mask |= piece << (i * 7n);
      } else break;
    }

    return mask;
  }

  southMask(piece) {
    let mask = 0n;

    for (let i = 1n; i <= 7n; i++) {
      mask |= piece >> (i * 8n);
    }

    return mask;
  }

  westMask(piece) {
    let mask = 0n;

    for (let i = 1n; i <= 7n; i++) {
      if ((piece << i) & ~this.FILE_H) {
        mask |= piece << i;
      } else break;
    }

    return mask;
  }

  northMask(piece) {
    let mask = 0n;

    for (let i = 1n; i <= 7n; i++) {
      mask |= piece << (i * 8n);
    }

    return mask;
  }

  eastMask(piece) {
    let mask = 0n;

    for (let i = 1n; i <= 7n; i++) {
      if ((piece >> i) & ~this.FILE_A) {
        mask |= piece >> i;
      } else break;
    }

    return mask;
  }

  msb(bb) {
    let bbString = bb.toString(2);
    while (bbString.length < 64) {
      bbString = `0${bbString}`;
    }
    const index = bbString.indexOf('1');

    return 1n << BigInt(63 - index);
  }

  lsb(bb) {
    return bb & ~(bb - 1n);
  }

  // convient au deux couleur juste changer notMyPieces
  kingsMoves(type, notMyPieces, oppPieces) {
    const moves = [];

    for (let i = 0; i < 64; i++) {
      if (this[type] & (1n << BigInt(i))) {
        const piece = 1n << BigInt(i);

        let movesMask;
        if (i > 9) {
          movesMask = (this.KING_SPAN << BigInt(i - 9)) & notMyPieces;
        } else {
          movesMask = (this.KING_SPAN >> BigInt(9 - i)) & notMyPieces;
        }

        if (piece & this.FILE_A) movesMask &= ~this.FILE_H;
        else if (piece & this.FILE_H) movesMask &= ~this.FILE_A;

        for (let j = 0; j < 64; j++) {
          if (movesMask & (1n << BigInt(j))) {
            const move = { mask: (1n << BigInt(j)) | piece, piece: type };
            if ((1n << BigInt(j)) & oppPieces) {
              move.capture = 1n << BigInt(j);
            }

            if (this.checkMove(move)) {
              moves.push(move);
            }
          }
        }
      }
    }

    return moves;
  }

  // convient au deux couleur juste changer notMyPieces
  knightsMoves(type, notMyPieces, oppPieces) {
    const moves = [];

    for (let i = 0; i < 64; i++) {
      if (this[type] & (1n << BigInt(i))) {
        const piece = 1n << BigInt(i);

        let movesMask;
        if (i > 18) {
          movesMask = (this.KNIGHT_SPAN << BigInt(i - 18)) & notMyPieces;
        } else {
          movesMask = (this.KNIGHT_SPAN >> BigInt(18 - i)) & notMyPieces;
        }

        if (piece & this.FILE_AB) movesMask &= ~this.FILE_GH;
        else if (piece & this.FILE_GH) movesMask &= ~this.FILE_AB;

        for (let j = 0; j < 64; j++) {
          if (movesMask & (1n << BigInt(j))) {
            const move = { mask: (1n << BigInt(j)) | piece, piece: type };
            if ((1n << BigInt(j)) & oppPieces) {
              move.capture = 1n << BigInt(j);
            }

            if (this.checkMove(move)) {
              moves.push(move);
            }
          }
        }
      }
    }

    return moves;
  }

  blackPawnsMoves() {
    const moves = [];

    // pawn capture right
    const captureRightMoves =
      (this.bp >> 7n) & this.whitePieces & ~this.RANK_1 & ~this.FILE_H;

    for (let i = 0; i < 64; i++) {
      if (captureRightMoves & (1n << BigInt(i))) {
        let mask = 1n << 7n;
        mask |= 1n;
        mask <<= BigInt(i);
        const move = { mask, piece: 'bp', capture: 1n << BigInt(i) };
        if (this.checkMove(move)) {
          moves.push(move);
        }
      }
    }

    // pawn capture left
    const captureLeftMoves =
      (this.bp >> 9n) & this.whitePieces & ~this.RANK_1 & ~this.FILE_A;

    for (let i = 0; i < 64; i++) {
      if (captureLeftMoves & (1n << BigInt(i))) {
        let mask = 1n << 9n;
        mask |= 1n;
        mask <<= BigInt(i);
        const move = { mask, piece: 'bp', capture: 1n << BigInt(i) };
        if (this.checkMove(move)) {
          moves.push(move);
        }
      }
    }

    // pawn capture right en passant
    const captureRightEnPassantMoves =
      (this.bp << 1n) & this.whitePieces & this.RANK_4 & ~this.FILE_H;

    for (let i = 0; i < 64; i++) {
      if (captureRightEnPassantMoves & (1n << BigInt(i))) {
        const enPassantMask = 1n << (BigInt(i) - 8n);
        if (enPassantMask === this.enPassant) {
          let mask = 1n << 7n;
          mask |= 1n;
          mask <<= BigInt(i) - 8n;
          const move = { mask, piece: 'bp', enPassant: enPassantMask };
          if (this.checkMove(move)) {
            moves.push(move);
          }
        }
      }
    }

    // pawn capture left en passant
    const captureLeftEnPassantMoves =
      (this.bp >> 1n) & this.whitePieces & this.RANK_4 & ~this.FILE_A;

    for (let i = 0; i < 64; i++) {
      if (captureLeftEnPassantMoves & (1n << BigInt(i))) {
        const enPassantMask = 1n << (BigInt(i) - 8n);
        if (enPassantMask === this.enPassant) {
          let mask = 1n << 9n;
          mask |= 1n;
          mask <<= BigInt(i) - 8n;
          const move = { mask, piece: 'bp', enPassant: enPassantMask };
          if (this.checkMove(move)) {
            moves.push(move);
          }
        }
      }
    }

    // pawn move forward 1
    const forwardMoves = (this.bp >> 8n) & this.empty & ~this.RANK_1;

    for (let i = 0; i < 64; i++) {
      if (forwardMoves & (1n << BigInt(i))) {
        let mask = 1n << 8n;
        mask |= 1n;
        mask <<= BigInt(i);
        const move = { mask, piece: 'bp' };
        if (this.checkMove(move)) {
          moves.push(move);
        }
      }
    }

    // pawn move forward 2
    const dblForwardMoves =
      (this.bp >> 16n) & this.empty & (this.empty >> 8n) & this.RANK_5;

    for (let i = 0; i < 64; i++) {
      if (dblForwardMoves & (1n << BigInt(i))) {
        let mask = 1n << 16n;
        mask |= 1n;
        mask <<= BigInt(i);
        const enPassantMask = 1n << (BigInt(i) + 8n);
        const move = { mask, piece: 'bp', enableEnPassant: enPassantMask };
        if (this.checkMove(move)) {
          moves.push(move);
        }
      }
    }

    // pawn promotion

    // pawn capture right promotion
    const captureRightPromotionMoves =
      (this.bp >> 7n) & this.whitePieces & this.RANK_1 & ~this.FILE_H;

    // peut peut etre ajouter un if (captureRightPromotionMoves) pour pas faire les 64 boucles pour rien
    for (let i = 0; i < 64; i++) {
      if (captureRightPromotionMoves & (1n << BigInt(i))) {
        let mask = 1n << 7n;
        mask |= 1n;
        mask <<= BigInt(i);

        const promotionMask = 1n << BigInt(i);
        const moveQueen = {
          mask,
          piece: 'bp',
          promotion: { piece: 'bq', mask: promotionMask },
          capture: promotionMask,
        };

        if (this.checkMove(moveQueen)) {
          moves.push(moveQueen);
        }

        const moveKnight = {
          ...moveQueen,
          promotion: { piece: 'bn', mask: promotionMask },
        };

        if (this.checkMove(moveKnight)) {
          moves.push(moveKnight);
        }

        const moveRook = {
          ...moveQueen,
          promotion: { piece: 'br', mask: promotionMask },
        };

        if (this.checkMove(moveRook)) {
          moves.push(moveRook);
        }

        const moveBishop = {
          ...moveQueen,
          promotion: { piece: 'bb', mask: promotionMask },
        };

        if (this.checkMove(moveBishop)) {
          moves.push(moveBishop);
        }
      }
    }

    // pawn capture left promotion
    const captureLeftPromotionMoves =
      (this.bp >> 9n) & this.whitePieces & this.RANK_1 & ~this.FILE_A;

    // peut peut etre ajouter un if (captureRightPromotionMoves) pour pas faire les 64 boucles pour rien
    for (let i = 0; i < 64; i++) {
      if (captureLeftPromotionMoves & (1n << BigInt(i))) {
        let mask = 1n << 9n;
        mask |= 1n;
        mask <<= BigInt(i);

        const promotionMask = 1n << BigInt(i);
        const moveQueen = {
          mask,
          piece: 'bp',
          promotion: { piece: 'bq', mask: promotionMask },
          capture: promotionMask,
        };

        if (this.checkMove(moveQueen)) {
          moves.push(moveQueen);
        }

        const moveKnight = {
          ...moveQueen,
          promotion: { piece: 'bn', mask: promotionMask },
        };

        if (this.checkMove(moveKnight)) {
          moves.push(moveKnight);
        }

        const moveRook = {
          ...moveQueen,
          promotion: { piece: 'br', mask: promotionMask },
        };

        if (this.checkMove(moveRook)) {
          moves.push(moveRook);
        }

        const moveBishop = {
          ...moveQueen,
          promotion: { piece: 'bb', mask: promotionMask },
        };

        if (this.checkMove(moveBishop)) {
          moves.push(moveBishop);
        }
      }
    }

    // pawn move forward 1 promotion
    const forwardPromotionMoves = (this.bp >> 8n) & this.empty & this.RANK_1;

    for (let i = 0; i < 64; i++) {
      if (forwardPromotionMoves & (1n << BigInt(i))) {
        let mask = 1n << 8n;
        mask |= 1n;
        mask <<= BigInt(i);

        const promotionMask = 1n << BigInt(i);
        const moveQueen = {
          mask,
          piece: 'bp',
          promotion: { piece: 'bq', mask: promotionMask },
        };

        if (this.checkMove(moveQueen)) {
          moves.push(moveQueen);
        }

        const moveKnight = {
          ...moveQueen,
          promotion: { piece: 'bn', mask: promotionMask },
        };

        if (this.checkMove(moveKnight)) {
          moves.push(moveKnight);
        }

        const moveRook = {
          ...moveQueen,
          promotion: { piece: 'br', mask: promotionMask },
        };

        if (this.checkMove(moveRook)) {
          moves.push(moveRook);
        }

        const moveBishop = {
          ...moveQueen,
          promotion: { piece: 'bb', mask: promotionMask },
        };

        if (this.checkMove(moveBishop)) {
          moves.push(moveBishop);
        }
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
        const move = { mask, piece: 'wp', capture: 1n << BigInt(i) };
        if (this.checkMove(move)) {
          moves.push(move);
        }
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
        const move = { mask, piece: 'wp', capture: 1n << BigInt(i) };
        if (this.checkMove(move)) {
          moves.push(move);
        }
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
          const move = { mask, piece: 'wp', enPassant: enPassantMask };
          if (this.checkMove(move)) {
            moves.push(move);
          }
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
          const move = { mask, piece: 'wp', enPassant: enPassantMask };
          if (this.checkMove(move)) {
            moves.push(move);
          }
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
        const move = { mask, piece: 'wp' };
        if (this.checkMove(move)) {
          moves.push(move);
        }
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
        const enPassantMask = 1n << (BigInt(i) - 8n);
        const move = { mask, piece: 'wp', enableEnPassant: enPassantMask };
        if (this.checkMove(move)) {
          moves.push(move);
        }
      }
    }

    // pawn promotion

    // pawn capture right promotion
    const captureRightPromotionMoves =
      (this.wp << 7n) & this.blackPieces & this.RANK_8 & ~this.FILE_A;

    // peut peut etre ajouter un if (captureRightPromotionMoves) pour pas faire les 64 boucles pour rien
    for (let i = 0; i < 64; i++) {
      if (captureRightPromotionMoves & (1n << BigInt(i))) {
        let mask = 1n << 7n;
        mask |= 1n;
        mask <<= BigInt(i) - 7n;

        const promotionMask = 1n << BigInt(i);
        const moveQueen = {
          mask,
          piece: 'wp',
          promotion: { piece: 'wq', mask: promotionMask },
          capture: promotionMask,
        };

        if (this.checkMove(moveQueen)) {
          moves.push(moveQueen);
        }

        const moveKnight = {
          ...moveQueen,
          promotion: { piece: 'wn', mask: promotionMask },
        };

        if (this.checkMove(moveKnight)) {
          moves.push(moveKnight);
        }

        const moveRook = {
          ...moveQueen,
          promotion: { piece: 'wr', mask: promotionMask },
        };

        if (this.checkMove(moveRook)) {
          moves.push(moveRook);
        }

        const moveBishop = {
          ...moveQueen,
          promotion: { piece: 'wb', mask: promotionMask },
        };

        if (this.checkMove(moveBishop)) {
          moves.push(moveBishop);
        }
      }
    }

    // pawn capture left promotion
    const captureLeftPromotionMoves =
      (this.wp << 9n) & this.blackPieces & this.RANK_8 & ~this.FILE_H;

    // peut peut etre ajouter un if (captureRightPromotionMoves) pour pas faire les 64 boucles pour rien
    for (let i = 0; i < 64; i++) {
      if (captureLeftPromotionMoves & (1n << BigInt(i))) {
        let mask = 1n << 9n;
        mask |= 1n;
        mask <<= BigInt(i) - 9n;

        const promotionMask = 1n << BigInt(i);
        const moveQueen = {
          mask,
          piece: 'wp',
          promotion: { piece: 'wq', mask: promotionMask },
          capture: promotionMask,
        };

        if (this.checkMove(moveQueen)) {
          moves.push(moveQueen);
        }

        const moveKnight = {
          ...moveQueen,
          promotion: { piece: 'wn', mask: promotionMask },
        };

        if (this.checkMove(moveKnight)) {
          moves.push(moveKnight);
        }

        const moveRook = {
          ...moveQueen,
          promotion: { piece: 'wr', mask: promotionMask },
        };

        if (this.checkMove(moveRook)) {
          moves.push(moveRook);
        }

        const moveBishop = {
          ...moveQueen,
          promotion: { piece: 'wb', mask: promotionMask },
        };

        if (this.checkMove(moveBishop)) {
          moves.push(moveBishop);
        }
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
        const moveQueen = {
          mask,
          piece: 'wp',
          promotion: { piece: 'wq', mask: promotionMask },
        };

        if (this.checkMove(moveQueen)) {
          moves.push(moveQueen);
        }

        const moveKnight = {
          ...moveQueen,
          promotion: { piece: 'wn', mask: promotionMask },
        };

        if (this.checkMove(moveKnight)) {
          moves.push(moveKnight);
        }

        const moveRook = {
          ...moveQueen,
          promotion: { piece: 'wr', mask: promotionMask },
        };

        if (this.checkMove(moveRook)) {
          moves.push(moveRook);
        }

        const moveBishop = {
          ...moveQueen,
          promotion: { piece: 'wb', mask: promotionMask },
        };

        if (this.checkMove(moveBishop)) {
          moves.push(moveBishop);
        }
      }
    }

    return moves;
  }

  whiteCastlesMoves() {
    const moves = [];

    if (
      this.castlingRights.includes('K') &&
      2n & this.empty &&
      4n & this.empty
    ) {
      moves.push({
        mask: 0xan,
        piece: 'wk',
        castle: { mask: 5n, piece: 'wr' },
      });
    }

    if (
      this.castlingRights.includes('Q') &&
      0x10n & this.empty &&
      0x20n & this.empty &&
      0x40n & this.empty
    ) {
      moves.push({
        mask: 0x28n,
        piece: 'wk',
        castle: { mask: 0x90n, piece: 'wr' },
      });
    }

    return moves;
  }

  blackCastlesMoves() {
    const moves = [];

    const f8 = 0x400000000000000n;
    const g8 = 0x200000000000000n;
    const d8 = 0x1000000000000000n;
    const c8 = 0x2000000000000000n;
    const b8 = 0x4000000000000000n;

    if (
      this.castlingRights.includes('k') &&
      f8 & this.empty &&
      g8 & this.empty
    ) {
      moves.push({
        mask: 0xa00000000000000n,
        piece: 'bk',
        castle: { mask: 0x500000000000000n, piece: 'br' },
      });
    }

    if (
      this.castlingRights.includes('q') &&
      b8 & this.empty &&
      c8 & this.empty &&
      d8 & this.empty
    ) {
      moves.push({
        mask: 0x2800000000000000n,
        piece: 'bk',
        castle: { mask: 0x9000000000000000n, piece: 'br' },
      });
    }

    return moves;
  }

  checkMove(move) {
    // this.playMove(move);
    // let legalMove;

    // if (this.turn) {
    //   if (this.unsafeForBlack() & this.bk) legalMove = false;
    //   else legalMove = true;
    // } else if (this.unsafeForWhite() & this.wk) legalMove = false;
    // else legalMove = true;

    // this.undoMove();
    // return legalMove;

    return true;
  }

  numberOfTrailingZeros(bb) {
    return bb.toString(2).length - 1;
  }

  numberOfOnes(bb) {
    let count = 0n;

    while (bb > 0n) {
      count += bb & 1n;
      bb >>= 1n;
    }

    return Number(count);
  }

  checkGameStage() {
    const bothSideNoQueen =
      this.numberOfOnes(this.wq) === 0 && this.numberOfOnes(this.bq) === 0;

    const noMinorPiece =
      !bothSideNoQueen &&
      this.numberOfOnes(this.wr) +
        this.numberOfOnes(this.wn) +
        this.numberOfOnes(this.wb) <=
        1 &&
      this.numberOfOnes(this.br) +
        this.numberOfOnes(this.bn) +
        this.numberOfOnes(this.bb) <=
        1;

    if (bothSideNoQueen || noMinorPiece) {
      console.warn('Change Game Stage to EG');
      this.stage = 'EG';
    }
  }

  perft(depth) {
    let totalMoves = 0;

    const self = this;

    function perftRecursive(currentDepth) {
      if (currentDepth === 0) {
        totalMoves++;
        return;
      }

      self.getMoves().forEach(move => {
        self.playMove(move);
        perftRecursive(currentDepth - 1);
        self.undoMove();
      });
    }

    perftRecursive(depth);

    return totalMoves;
  }

  squareBitboard(square) {
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

  allWhitePieces() {
    return this.wp | this.wr | this.wn | this.wb | this.wq | this.wk;
  }

  allBlackPieces() {
    return this.bp | this.br | this.bn | this.bb | this.bq | this.bk;
  }

  getFEN() {
    let fen = '';

    function toBinary64Bits(number) {
      while (number.length < 64) {
        number = `0${number}`;
      }

      return number;
    }

    const pieces = [
      { piece: 'P', bb: toBinary64Bits(this.wp.toString(2)) },
      { piece: 'R', bb: toBinary64Bits(this.wr.toString(2)) },
      { piece: 'N', bb: toBinary64Bits(this.wn.toString(2)) },
      { piece: 'B', bb: toBinary64Bits(this.wb.toString(2)) },
      { piece: 'Q', bb: toBinary64Bits(this.wq.toString(2)) },
      { piece: 'K', bb: toBinary64Bits(this.wk.toString(2)) },
      { piece: 'p', bb: toBinary64Bits(this.bp.toString(2)) },
      { piece: 'r', bb: toBinary64Bits(this.br.toString(2)) },
      { piece: 'n', bb: toBinary64Bits(this.bn.toString(2)) },
      { piece: 'b', bb: toBinary64Bits(this.bb.toString(2)) },
      { piece: 'q', bb: toBinary64Bits(this.bq.toString(2)) },
      { piece: 'k', bb: toBinary64Bits(this.bk.toString(2)) },
    ];

    let blankSpaces = 0;

    for (let i = 0; i < 64; i++) {
      for (let j = 0; j < 12; j++) {
        if (pieces[j].bb[i] === '1') {
          if (blankSpaces) fen += blankSpaces;
          fen += pieces[j].piece;
          blankSpaces = 0;
          break;
        } else if (j === 11) {
          blankSpaces++;
          break;
        }
      }

      if (
        i === 7 ||
        i === 15 ||
        i === 23 ||
        i === 31 ||
        i === 39 ||
        i === 47 ||
        i === 55
      ) {
        if (blankSpaces !== 0) fen += blankSpaces;
        blankSpaces = 0;
        fen += '/';
      }

      if (i === 63 && blankSpaces !== 0) fen += blankSpaces;
    }

    return fen;
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
}
