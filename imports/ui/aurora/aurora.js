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
    this.whitePieces = [];
    this.blackPieces = [];
    this.numSquaresToEdge = [];

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
        this.pieces[rank * 8 + file] = {
          piece: `${pieceColor}${pieceType}`,
          color: pieceColor,
          type: pieceType,
          pos: rank * 8 + file,
        };
        if (
          pieceType === 'p' &&
          ((pieceColor === 'w' && rank === 1) ||
            (pieceColor === 'b' && rank === 6))
        ) this.pieces[rank * 8 + file].pawnAdvance = true;
        else this.pieces[rank * 8 + file].pawnAdvance = false;
        file++;
      }
    });
  }

  getMoves(depthOfMoves, pieceToMove) {
    const moves = [];

    if (pieceToMove) {
      console.log(pieceToMove);
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
            moves.push(
              `${pos} - ${
                pos + this.directionOffsets[directionIndexes[index]]
              }`,
            );
          }
        }
      }
    } else if (type === 'n') {
      console.log(type, pos);
    } else {
      console.log(type, pos);
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
        }

        moves.push(`${square} - ${targetSquare}`);

        if (targetPiece && targetPiece.color !== this.turn) {
          break;
        }
      }
    }

    return moves;
  }

  playMove(move) {
    const fromSquare = move.split(' ')[0];
    const toSquare = parseInt(move.split(' ')[2], 10);
    const promotion = move.split(' ')[3];

    this.pieces[toSquare] = this.pieces[fromSquare];
    this.pieces[toSquare].pos = toSquare;
    if (this.pieces[fromSquare].pawnAdvance) this.pieces[toSquare].pawnAdvance = false;
    this.pieces[fromSquare] = null;
    if (promotion) {
      this.pieces[toSquare].type = promotion;
      this.pieces[toSquare].piece = this.pieces[toSquare].piece[0] + promotion;
    }

    this.switchTurn();
    this.showAscii();
  }

  isMove(from, to, promotion) {
    const fromSquare = this.toSquare(from);
    const toSquare = this.toSquare(to);
    const moves = this.getMoves();

    let moveToPlay;

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i].split(' ');
      if (parseInt(move[0], 10) === fromSquare && parseInt(move[2], 10) === toSquare) {
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
