/* eslint-disable prefer-destructuring */
import { Chess } from 'chess.js';

// eslint-disable-next-line import/prefer-default-export
export class Aurora {
  constructor(board, game, selfPlay) {
    this.board = board;
    this.game = game;
    this.selfPlay = selfPlay;
    this.autoPlaySpeed = 400;
    this.play = true;
    this.pieceValues = {
      p: 1, // Pion
      n: 3, // Cavalier
      b: 3, // Fou
      r: 5, // Tour
      q: 9, // Reine
    };
  }

  // eslint-disable-next-line consistent-return
  makeMove() {
    if (this.game.isCheckmate()) {
      this.play = false;
      if (this.game.turn() === 'w') return console.log('Black won');
      else return console.log('White won');
    }

    if (
      this.game.isDraw() ||
      this.game.isInsufficientMaterial() ||
      this.game.isStalemate() ||
      this.game.isThreefoldRepetition()
    ) {
      return console.log('Draw');
    }

    const simulation = new Chess();
    const fen = this.game.fen();
    const moves = this.game.moves();
    let captureMoves = [];
    moves.forEach(move => {
      simulation.load(fen);
      const moveInfo = simulation.move(move);
      if (moveInfo.captured) {
        const selfValue = this.pieceValues[moveInfo.piece];
        const captureValue = this.pieceValues[moveInfo.captured];
        const tradeValue = captureValue - selfValue;
        if (captureMoves.length === 0) {
          if (tradeValue >= 0) {
            captureMoves.push({ move, tradeValue });
          }
        } else if (tradeValue > captureMoves[0].tradeValue) {
          captureMoves = [{ move, tradeValue }];
        } else if (tradeValue === captureMoves[0].tradeValue) {
          captureMoves.push({ move, tradeValue });
        }
      }
    });

    let move;
    if (captureMoves.length === 1) {
      move = captureMoves[0].move;
    } else if (captureMoves.length > 1) {
      move = captureMoves[Math.floor(Math.random() * captureMoves.length)].move;
    } else {
      const randomMoves = this.game.moves();
      move = randomMoves[Math.floor(Math.random() * randomMoves.length)];
    }

    this.game.move(move);
  }

  autoPlay(board) {
    this.makeMove();
    board.position(this.game.fen());
    if (this.play) window.setTimeout(() => this.autoPlay(board), this.autoPlaySpeed);
  }
}
