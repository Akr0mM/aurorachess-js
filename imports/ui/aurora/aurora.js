/* eslint-disable class-methods-use-this */
// eslint-disable-next-line import/prefer-default-export
export class Aurora {
  constructor(fen) {
    this.fen =
      fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
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
    let moves = [];

    if (pieceToMove) {
      if (pieceToMove.type === 'p') moves = this.getPawnsMoves(pieceToMove);
      else if (pieceToMove.type === 'n') moves = this.getKnightMoves(pieceToMove);
      else if (pieceToMove.type === 'r') moves = this.getRookMoves(pieceToMove);
      else if (pieceToMove.type === 'k') moves = this.getKingMoves(pieceToMove);
    } else {
      this.pieces.forEach(piece => {
        if (piece && piece.color === this.turn) {
          if (this.isSlidingPiece(piece.type)) {
            // moves.push(...this.generateSlidingMoves(piece.pos, piece.type));
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
      let targetPiece =
        this.pieces[pos + this.directionOffsets[directionIndex]];
      if (!targetPiece) {
        moves.push(`${pos} - ${pos + this.directionOffsets[directionIndex]}`);
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
      const directionIndexes = this.turn === 'w' ? [7, 9] : [-7, -9];
      for (let index = 0; index < 2; index++) {
        const capturedPiece = this.pieces[pos + directionIndexes[index]];
        if (capturedPiece && capturedPiece.color !== this.turn) {
          moves.push(`${pos} - ${pos + directionIndexes[index]}`);
        }
      }
    } else if (type === 'n') {
    } else {
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

  playMove(move, promotion) {
    promotion = promotion || 'q';
    const fromSquare = move.split(' ')[0];
    const toSquare = parseInt(move.split(' ')[2], 10);

    this.pieces[fromSquare].pos = toSquare;
    if (this.pieces[fromSquare].pawnAdvance) this.pieces[fromSquare].pawnAdvance = false;
    this.pieces[toSquare] = this.pieces[fromSquare];
    this.pieces[fromSquare] = null;

    this.switchTurn();
    this.showAscii();
  }

  isMove(from, to) {
    const fromSquare = this.toSquare(from);
    const toSquare = this.toSquare(to);
    const moves = this.getMoves();

    const move = `${fromSquare} - ${toSquare}`;
    return moves.includes(move) ? move : false;
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
