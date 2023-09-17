/* eslint-disable class-methods-use-this */
// eslint-disable-next-line import/prefer-default-export
export class Aurora {
  constructor(config) {
    this.fen = config.fen;
    this.board = config.board;
    this.enPassant = '';
    this.undoHistory = [];

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

    this.load(this.fen);
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
    }

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

  playMove(move) {
    // update the bitboard of the piece that play
    this[move.piece] ^= move.mask;
    const undo = move;

    // switch turn
    this.turn = !this.turn;

    // check if move is a capture to update the capture piece's bitboard (remove the piece)
    if (move.capture) {
      if (this.turn) this.captureWhitePiece(move.capture, undo);
      else this.captureBlackPiece(move.capture, undo);
    }

    // ! check if a rook is capture to remove castle on its side
    // * mettre les castling rights qu'on enlenve dans undo.castling pr pouvoir les remettre au undo

    // ! disable castle after a rook move on his side
    // * mettre les castling rights qu'on enlenve dans undo.castling pr pouvoir les remettre au undo
    // ? if (move.piece === 'wr') {

    // ? } else if (move.piece === 'br') {

    // ? }

    // disable castling after kings move
    if (move.piece === 'wk') {
      const castlingRights = [];
      const kingIndex = this.castlingRights.indexOf('K');
      if (kingIndex !== -1) {
        castlingRights.push('K');
        this.castlingRights.splice(kingIndex, 1);
      }

      const queenIndex = this.castlingRights.indexOf('Q');
      if (queenIndex !== -1) {
        castlingRights.push('Q');
        this.castlingRights.splice(queenIndex, 1);
      }

      if (castlingRights.length !== 0) undo.castlingRights = castlingRights;
    } else if (move.piece === 'bk') {
      const castlingRights = [];
      const kingIndex = this.castlingRights.indexOf('k');
      if (kingIndex !== -1) {
        castlingRights.push('k');
        this.castlingRights.splice(kingIndex, 1);
      }

      const queenIndex = this.castlingRights.indexOf('q');
      if (queenIndex !== -1) {
        castlingRights.push('q');
        this.castlingRights.splice(queenIndex, 1);
      }

      if (castlingRights.length !== 0) undo.castlingRights = castlingRights;
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

    this.undoHistory.unshift(undo);
    console.log(this.undoHistory);
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
    console.log(undo);
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

  undoMove() {
    const move = this.undoHistory[0];
    this[move.piece] ^= move.mask;

    if (move.capture) {
      this[move.capture.piece] |= move.capture.mask;
    }

    if (move.castlingRights) {
      this.castlingRights.push(...move.castlingRights);
      console.log(this.castlingRights);
    }

    if (move.castle) {
      this[move.castle.piece] ^= move.castle.mask;
    }

    if (move.enPassant) {
      console.log(move);
      this.ascii(move.enPassant);
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

    const legalMove = moves.find(move => move.mask === moveMask);

    return legalMove;
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
      // moves.push(...this.whiteRooksMoves());
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
      moves.push(...this.blackCastlesMoves());
    }

    console.log(moves);
    // this.ascii(68719476736n);
    // moves.forEach(move => this.ascii(move.mask, move.piece));
    return moves;
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
            moves.push(move);
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
            moves.push(move);
          }
        }
      }
    }

    return moves;
  }

  whiteRooksMoves() {
    const moves = [];

    for (let i = 0; i < 64; i++) {
      if (this.wr & (1n << BigInt(i))) {
        let piece = 1n << BigInt(i);
        let rank = 0;
        let pieceRank = piece;
        while (pieceRank > 0) {
          rank++;
          pieceRank >>= 8n;
        }
        const rankMask = 0xffn << BigInt((rank - 1) * 8);
        const occupiedHorizontal =
          (rankMask & this.occupied) >> BigInt((rank - 1) * 8);
        piece >>= BigInt((rank - 1) * 8);

        const right = 0x101010101010100n;

        const lineAttacks =
          occupiedHorizontal ^
          (((occupiedHorizontal | right) - 2n * piece) & ~right) ^
          (occupiedHorizontal ^
            this.r(
              ((this.r(occupiedHorizontal, 8) | right) -
                2n * this.r(piece, 8)) &
                ~right,
              8,
            ));

        this.ascii(lineAttacks);
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
        moves.push({ mask, piece: 'bp', capture: 1n << BigInt(i) });
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
        moves.push({ mask, piece: 'bp', capture: 1n << BigInt(i) });
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
          moves.push({ mask, piece: 'bp', enPassant: enPassantMask });
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
          moves.push({ mask, piece: 'bp', enPassant: enPassantMask });
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
        moves.push({ mask, piece: 'bp' });
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
        moves.push({ mask, piece: 'bp', enableEnPassant: enPassantMask });
      }
    }

    // pawn promotion

    // pawn capture right promotion
    const captureRightPromotionMoves =
      (this.bp >> 7n) & this.whitePieces & this.RANK_1;

    // peut peut etre ajouter un if (captureRightPromotionMoves) pour pas faire les 64 boucles pour rien
    for (let i = 0; i < 64; i++) {
      if (captureRightPromotionMoves & (1n << BigInt(i))) {
        let mask = 1n << 7n;
        mask |= 1n;
        mask <<= BigInt(i);

        const promotionMask = 1n << BigInt(i);

        moves.push({
          mask,
          piece: 'bp',
          promotion: { piece: 'bq', mask: promotionMask },
        });

        moves.push({
          mask,
          piece: 'bp',
          promotion: { piece: 'bn', mask: promotionMask },
        });

        moves.push({
          mask,
          piece: 'bp',
          promotion: { piece: 'br', mask: promotionMask },
        });

        moves.push({
          mask,
          piece: 'bp',
          promotion: { piece: 'bb', mask: promotionMask },
        });
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

        moves.push({
          mask,
          piece: 'bp',
          promotion: { piece: 'bq', mask: promotionMask },
        });

        moves.push({
          mask,
          piece: 'bp',
          promotion: { piece: 'bn', mask: promotionMask },
        });

        moves.push({
          mask,
          piece: 'bp',
          promotion: { piece: 'br', mask: promotionMask },
        });

        moves.push({
          mask,
          piece: 'bp',
          promotion: { piece: 'bb', mask: promotionMask },
        });
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

        moves.push({
          mask,
          piece: 'bp',
          promotion: { piece: 'bq', mask: promotionMask },
        });

        moves.push({
          mask,
          piece: 'bp',
          promotion: { piece: 'bn', mask: promotionMask },
        });

        moves.push({
          mask,
          piece: 'bp',
          promotion: { piece: 'br', mask: promotionMask },
        });

        moves.push({
          mask,
          piece: 'bp',
          promotion: { piece: 'bb', mask: promotionMask },
        });
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
        moves.push({ mask, piece: 'wp', capture: 1n << BigInt(i) });
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
        moves.push({ mask, piece: 'wp', capture: 1n << BigInt(i) });
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
        const enPassantMask = 1n << (BigInt(i) - 8n);
        moves.push({ mask, piece: 'wp', enableEnPassant: enPassantMask });
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

    // peut peut etre ajouter un if (captureRightPromotionMoves) pour pas faire les 64 boucles pour rien
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

  r(binary, l) {
    let binaryString = binary.toString(2);
    while (binaryString.length < l) {
      binaryString = `0${binaryString}`;
    }

    const reversedBinary = binaryString.split('').reverse().join('');
    const reversedDecimal = parseInt(reversedBinary, 2);

    return BigInt(reversedDecimal);
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
