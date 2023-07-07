/* eslint-disable class-methods-use-this */
// eslint-disable-next-line import/prefer-default-export
export class Aurora {
  constructor(config) {
    this.fen =
      config.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    this.board = config.board;
    this.directionOffsets = [8, -8, -1, 1, 7, -7, 9, -9];
    this.pieces = [];
    this.turn = 'w';
    this.castles = ['K', 'Q', 'k', 'q'];
    this.numSquaresToEdge = [];
    this.updateBoardOnSnapEnd = false;

    console.clear();
    this.initPosition();
    this.precomputedMoveData();
    this.getMoves(1);
    this.getFEN();
  }

  initPosition() {
    const fenSplit = this.fen.split(' ');
    const fenBoard = fenSplit[0].split('');

    let rank = 7;
    let file = 0;

    fenBoard.forEach(char => {
      if (char === '/') {
        rank--;
        file = 0;
        // eslint-disable-next-line no-restricted-globals
      } else if (!isNaN(char)) {
        file += parseInt(char, 10);
      } else {
        const pieceColor = /[A-Z]/.test(char) ? 'w' : 'b';
        const pieceType = char.toLowerCase();
        const pos = rank * 8 + file;
        this.pieces[pos] = {
          piece: `${pieceColor}${pieceType}`,
          color: pieceColor,
          type: pieceType,
          pos,
        };

        if (pieceType === 'p') this.pieces[pos].enPassant = false;

        if (
          pieceType === 'p' &&
          ((pieceColor === 'w' && rank === 1) ||
            (pieceColor === 'b' && rank === 6))
        ) this.pieces[pos].pawnAdvance = true;
        else this.pieces[pos].pawnAdvance = false;
        file++;
      }
    });
  }

  getMoves(depthOfMoves, pieceToMove) {
    const moves = [];

    if (pieceToMove) {
      if (pieceToMove.color === this.turn) {
        if (this.isSlidingPiece(pieceToMove.type)) {
          moves.push(
            ...this.generateSlidingMoves(pieceToMove.pos, pieceToMove.type),
          );
        } else {
          moves.push(
            ...this.generateMoves(
              pieceToMove.type,
              pieceToMove.pos,
              pieceToMove.pawnAdvance,
            ),
          );
        }
      }
    } else {
      this.pieces.forEach(piece => {
        if (piece && piece.color === this.turn) {
          if (this.isSlidingPiece(piece.type)) {
            moves.push(...this.generateSlidingMoves(piece.pos, piece.type));
          } else {
            moves.push(
              ...this.generateMoves(piece.type, piece.pos, piece.pawnAdvance),
            );
          }
        }
      });
    }

    console.log(moves);
    return moves;
  }

  generateMoves(type, pos, pawnAdvance) {
    const moves = [];

    if (type === 'p') {
      // move
      const directionIndex = this.turn === 'w' ? 0 : 1;
      const upSquare = pos + this.directionOffsets[directionIndex];
      let targetPiece = this.pieces[upSquare];
      if (!targetPiece) {
        if ((upSquare >= 56 && upSquare <= 63) || upSquare <= 7) {
          moves.push(`${pos} - ${upSquare} q`);
          moves.push(`${pos} - ${upSquare} n`);
          moves.push(`${pos} - ${upSquare} r`);
          moves.push(`${pos} - ${upSquare} b`);
        } else moves.push(`${pos} - ${upSquare}`);
        if (pawnAdvance) {
          targetPiece =
            this.pieces[pos + 2 * this.directionOffsets[directionIndex]];
          if (!targetPiece) {
            moves.push(
              `${pos} - ${pos + 2 * this.directionOffsets[directionIndex]}`,
            );
          }
        }
      }

      // capture
      const directionIndexes = this.turn === 'w' ? [4, 6] : [5, 7];
      for (let index = 0; index < 2; index++) {
        if (this.numSquaresToEdge[pos][directionIndexes[index]] > 0) {
          const capturedPiece =
            this.pieces[pos + this.directionOffsets[directionIndexes[index]]];
          if (capturedPiece && capturedPiece.color !== this.turn) {
            moves.push(`${pos} x ${capturedPiece.pos}`);
          }
        }
      }

      // en passant
      const enPassantIndexes = [2, 3];
      const enPassantCaptures = this.turn === 'w' ? [7, 9] : [-9, -7];
      for (let i = 0; i < 2; i++) {
        const square = pos + this.directionOffsets[enPassantIndexes[i]];
        if (this.numSquaresToEdge[pos][enPassantIndexes[i]] > 0) {
          if (this.pieces[square] && this.pieces[square].enPassant) {
            moves.push(`${pos} x ${pos + enPassantCaptures[i]}`);
          }
        }
      }
    } else if (type === 'n') {
      // all 8 knight moves
      const knightMoves = [
        [15, [0, 2]],
        [17, [0, 3]],
        [10, [3, 0]],
        [-6, [3, 1]],
        [-15, [1, 3]],
        [-17, [1, 2]],
        [-10, [2, 1]],
        [6, [2, 0]],
      ];

      for (let i = 0; i < 8; i++) {
        if (
          // has space required to move
          this.numSquaresToEdge[pos][knightMoves[i][1][0]] >= 2 &&
          this.numSquaresToEdge[pos][knightMoves[i][1][1]] >= 1
        ) {
          const targetSquare = this.pieces[pos + knightMoves[i][0]];
          if (targetSquare && targetSquare.color !== this.turn) {
            moves.push(`${pos} x ${targetSquare.pos}`);
          } else if (!targetSquare) {
            moves.push(`${pos} - ${pos + knightMoves[i][0]}`);
          }
        }
      }
    } else {
      for (let i = 0; i < 8; i++) {
        const target = pos + this.directionOffsets[i];
        // if has space required to move
        if (this.numSquaresToEdge[pos][i]) {
          const targetSquare = this.pieces[target];
          if (targetSquare && targetSquare.color !== this.turn) {
            moves.push(`${pos} x ${targetSquare.pos}`);
          } else if (!targetSquare) {
            moves.push(`${pos} - ${target}`);
          }
        }
      }
    }

    return moves;
  }

  generateSlidingMoves(square, piece) {
    const moves = [];
    const startDirIndex = piece === 'b' ? 4 : 0;
    const endDirIndex = piece === 'r' ? 4 : 8;

    for (
      let directionIndex = startDirIndex;
      directionIndex < endDirIndex;
      directionIndex++
    ) {
      for (let n = 0; n < this.numSquaresToEdge[square][directionIndex]; n++) {
        const targetSquare =
          square + this.directionOffsets[directionIndex] * (n + 1);
        const targetPiece = this.pieces[targetSquare];

        if (targetPiece && targetPiece.color === this.turn) {
          break;
        } else if (targetPiece && targetPiece.color !== this.turn) {
          moves.push(`${square} x ${targetSquare}`);
          break;
        } else {
          moves.push(`${square} - ${targetSquare}`);
        }
      }
    }

    return moves;
  }

  playMove(move) {
    this.updateBoardOnSnapEnd = false;
    const fromSquare = move.split(' ')[0];
    const toSquare = parseInt(move.split(' ')[2], 10);
    const promotion = move.split(' ')[3];

    // move
    this.pieces[toSquare] = this.pieces[fromSquare];
    this.pieces[toSquare].pos = toSquare;
    if (this.pieces[fromSquare].pawnAdvance) this.pieces[toSquare].pawnAdvance = false;
    this.pieces[fromSquare] = null;
    if (promotion) {
      this.pieces[toSquare].type = promotion;
      this.pieces[toSquare].piece = this.pieces[toSquare].piece[0] + promotion;
      this.updateBoardOnSnapEnd = true;
    }

    // if en passant remove pawn
    const enPassantCapture = this.turn === 'w' ? -8 : 8;
    if (this.pieces[toSquare].type === 'p') {
      if (
        this.pieces[toSquare + enPassantCapture] &&
        this.pieces[toSquare + enPassantCapture].enPassant === true
      ) {
        this.pieces[toSquare + enPassantCapture] = null;
        this.board.position(this.getFEN());
      }
    }

    // turn off en passant on all panws
    this.noEnPassant();

    // enable en passant if moves forward 2 squares
    if (
      this.pieces[toSquare].type === 'p' &&
      (toSquare - fromSquare === 16 || toSquare - fromSquare === -16)
    ) this.pieces[toSquare].enPassant = true;

    this.switchTurn();
    this.showAscii();
  }

  noEnPassant() {
    this.pieces.forEach(piece => {
      if (piece && piece.type === 'p') piece.enPassant = false;
    });
  }

  isMove(from, to, promotion) {
    const fromSquare = this.toSquare(from);
    const toSquare = this.toSquare(to);
    const moves = this.getMoves();

    let moveToPlay;

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i].split(' ');
      if (
        parseInt(move[0], 10) === fromSquare &&
        parseInt(move[2], 10) === toSquare
      ) {
        if (move[3]) {
          if (move[3] === promotion) {
            moveToPlay = moves[i];
            break;
          }
        } else {
          moveToPlay = moves[i];
          break;
        }
      }
    }

    return moveToPlay;
  }

  highlightMoves(from, piece) {
    const pos = this.toSquare(from);
    const { pawnAdvance } = this.pieces[pos];

    piece = {
      type: piece[1].toLowerCase(),
      color: piece[0],
      pos,
      pawnAdvance,
    };

    const moves = this.getMoves(1, piece);
    moves.push(`- - ${pos}`);
    moves.forEach(move => {
      const square = this.toBoard(move.split(' ')[2]);
      const $square = $('.board-b72b1')
        .children()
        .eq(square.rank)
        .children()
        .eq(square.file);

      if ($square.hasClass('white-1e1d7')) {
        if (moves.indexOf(move) === moves.length - 1) {
          $square.addClass('highlight-moves-source-white');
        } else {
          $square.addClass('highlight-moves-white');
        }
      } else if (moves.indexOf(move) === moves.length - 1) {
        $square.addClass('highlight-moves-source-black');
      } else {
        $square.addClass('highlight-moves-black');
      }
    });
  }

  toSquare(coor) {
    const fileCoordinates = {
      a: 0,
      b: 1,
      c: 2,
      d: 3,
      e: 4,
      f: 5,
      g: 6,
      h: 7,
    };

    const file = fileCoordinates[coor.split('')[0]];
    const rank = (coor.split('')[1] - 1) * 8;

    return rank + file;
  }

  isSlidingPiece(pieceType) {
    return pieceType === 'q' || pieceType === 'b' || pieceType === 'r';
  }

  showAscii() {
    const ranks = [[], [], [], [], [], [], [], []];

    for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
      for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
        ranks[rankIndex].push('--');
      }
    }

    for (let i = 0; i < this.pieces.length; i++) {
      if (this.pieces[i]) {
        const pieceRank =
          this.turn === 'w' ?
            7 - Math.floor(this.pieces[i].pos / 8) :
            Math.floor(this.pieces[i].pos / 8);
        const pieceFile =
          this.turn === 'w' ?
            this.pieces[i].pos % 8 :
            7 - (this.pieces[i].pos % 8);
        ranks[pieceRank][pieceFile] = this.pieces[i].piece;
      }
    }

    console.table(ranks);
  }

  toBoard(square) {
    return {
      rank: 7 - Math.floor(square / 8),
      file: square % 8,
    };
  }

  switchTurn() {
    this.turn = this.turn === 'w' ? 'b' : 'w';
    return this.turn;
  }

  getFEN() {
    let empty = 0;
    let fen = '';

    for (let i = 0; i < 64; i++) {
      const rank = 7 - Math.floor(i / 8);
      const file = i % 8;
      const index = 8 * rank + file;

      if (this.pieces[index]) {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        const { color, type } = this.pieces[index];

        fen += color === 'w' ? type.toUpperCase() : type.toLowerCase();
      } else {
        empty++;
      }

      if ((index + 1) % 8 !== (index % 8) + 1) {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        if (index !== 7) {
          fen += '/';
        }
      }
    }
    fen += ` ${this.turn} `;
    return fen;
  }

  precomputedMoveData() {
    for (let file = 0; file < 8; file++) {
      for (let rank = 0; rank < 8; rank++) {
        const up = 7 - rank;
        const down = rank;
        const left = file;
        const right = 7 - file;

        const squareIndex = rank * 8 + file;

        this.numSquaresToEdge[squareIndex] = [
          up,
          down,
          left,
          right,
          Math.min(up, left),
          Math.min(down, right),
          Math.min(up, right),
          Math.min(down, left),
        ];
      }
    }
  }
}
