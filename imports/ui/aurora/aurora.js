/* eslint-disable prefer-destructuring */
import { Chess } from 'chess.js';

// eslint-disable-next-line import/prefer-default-export
export class Aurora {
  constructor(board, game, selfPlay) {
    this.board = board;
    this.game = game;
    this.selfPlay = selfPlay;
    this.autoPlaySpeed = 600;
    this.play = true;
    this.pieceValues = {
      p: 1, // Pion
      n: 3, // Cavalier
      b: 3, // Fou
      r: 5, // Tour
      q: 9, // Reine
    };

    this.piecesEvaluation = {
      k: 200,
      q: 9,
      r: 5,
      n: 3,
      b: 3,
      p: 1,
      m: 0.07,
    };
  }

  makeMove() {
    if (this.gameIsOver()) return;

    console.log(this.evaluateStaticPosition(this.game.fen()).toFixed(2));
    $('#evaluation').text(
      this.evaluateStaticPosition(this.game.fen()).toFixed(2),
    );

    const simulation = new Chess();
    const moves = this.game.moves();
    const fen = this.game.fen();
    const movesEvaluation = [];

    moves.forEach(move => {
      simulation.load(fen);
      simulation.move(move);
      const evaluation = this.evaluateStaticPosition(simulation.fen());
      movesEvaluation.push({ move, evaluation });
    });

    console.log(movesEvaluation);
    const evaluations = movesEvaluation.sort(
      (a, b) => b.evaluation - a.evaluation,
    );

    const maxEvaluation = evaluations[0].evaluation;
    const maxEvaluations = evaluations.filter(
      move => move.evaluation === maxEvaluation,
    );

    const minEvaluation = evaluations[evaluations.length - 1].evaluation;
    const minEvaluations = evaluations.filter(
      move => move.evaluation === minEvaluation,
    );

    console.log(maxEvaluations);
    console.log(minEvaluations);

    let bestMove;
    let worstMove;
    if (this.game.turn() === 'w') {
      bestMove =
        maxEvaluations[Math.floor(Math.random() * maxEvaluations.length)];
      worstMove =
        minEvaluations[Math.floor(Math.random() * minEvaluations.length)];
    } else {
      bestMove =
        minEvaluations[Math.floor(Math.random() * minEvaluations.length)];
      worstMove =
        maxEvaluations[Math.floor(Math.random() * maxEvaluations.length)];
    }

    console.log(bestMove);
    console.log(worstMove);

    this.game.move(bestMove.move);
  }

  evaluateStaticPosition(fen) {
    const evaluation = new Chess(fen);
    const board = evaluation.board();
    let whitePoints = 0;
    let blackPoints = 0;
    const evaluationCopy = new Chess(this.turn(evaluation.fen()));
    let whiteMobilityPoints;
    let blackMobilityPoints;
    if (evaluation.turn() === 'w') {
      whiteMobilityPoints = evaluation.moves().length * this.piecesEvaluation.m;
      blackMobilityPoints =
        evaluationCopy.moves().length * this.piecesEvaluation.m;
    } else {
      whiteMobilityPoints =
        evaluationCopy.moves().length * this.piecesEvaluation.m;
      blackMobilityPoints = evaluation.moves().length * this.piecesEvaluation.m;
    }

    board.forEach(row => {
      row.forEach(square => {
        if (square) {
          if (square.color === 'w') whitePoints += this.piecesEvaluation[square.type];
          if (square.color === 'b') blackPoints += this.piecesEvaluation[square.type];
        }
      });
    });
    whitePoints += whiteMobilityPoints;
    blackPoints += blackMobilityPoints;
    return whitePoints - blackPoints;
  }

  // eslint-disable-next-line class-methods-use-this
  turn(fen) {
    if (fen.includes(' b ')) return fen.replace(' b ', ' w ');
    else return fen.replace(' w ', ' b ');
  }

  autoPlay(board) {
    this.makeMove();
    board.position(this.game.fen());
    if (this.play) window.setTimeout(() => this.autoPlay(board), this.autoPlaySpeed);
  }

  // eslint-disable-next-line consistent-return
  gameIsOver() {
    if (this.game.isCheckmate()) {
      this.play = false;
      if (this.game.turn() === 'w') return console.log('Black won');
      else {
        console.log('White won');
        return true;
      }
    }

    if (
      this.game.isDraw() ||
      this.game.isInsufficientMaterial() ||
      this.game.isStalemate() ||
      this.game.isThreefoldRepetition()
    ) {
      console.log('Draw');
      return true;
    }
  }
}
