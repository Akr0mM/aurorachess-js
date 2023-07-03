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

    const fen = this.game.fen();
    const simulation = new Chess(this.game.fen());
    const moves = simulation.moves();
    let simulations = [];
    let bestMove;

    moves.forEach(move => {
      simulation.load(fen);
      simulation.move(move);
      const evaluation = this.evaluateStaticPosition(simulation.fen());
      const oppBestMove = this.getBestMove(simulation.fen());
      simulation.move(oppBestMove);
      const oppEvaluation = this.evaluateStaticPosition(simulation.fen());
      simulations.push({
        move,
        evaluation,
        bestMove: { move: oppBestMove, evaluation: oppEvaluation },
      });
    });

    simulations = simulations.sort(
      (a, b) => a.bestMove.evaluation - b.bestMove.evaluation,
    );

    const maxEvaluation = simulations[0].bestMove.evaluation;
    simulations = simulations.filter(
      move => move.bestMove.evaluation === maxEvaluation,
    );

    console.log(simulations);
    bestMove = simulations[Math.floor(Math.random() * simulations.length)].move;
    this.game.move(bestMove);
  }

  getBestMove(fen) {
    const simulation = new Chess(fen);
    const moves = simulation.moves();
    const movesEvaluations = [];

    moves.forEach(move => {
      simulation.load(fen);
      simulation.move(move);
      const evaluation = this.evaluateStaticPosition(simulation.fen());
      movesEvaluations.push({ move, evaluation });
    });

    const evaluations = movesEvaluations.sort(
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

    simulation.load(fen);
    let bestMove;
    if (simulation.turn() === 'w') {
      bestMove =
        maxEvaluations[Math.floor(Math.random() * maxEvaluations.length)];
    } else {
      bestMove =
        minEvaluations[Math.floor(Math.random() * minEvaluations.length)];
    }

    return bestMove.move;
  }

  evaluateStaticPosition(fen) {
    const evaluation = new Chess(fen);
    const board = evaluation.board();
    let whitePoints = 0;
    let blackPoints = 0;
    const evaluationCopy = new Chess(fen);
    if (evaluationCopy.turn() === 'w') evaluationCopy._turn = 'b';
    else evaluationCopy._turn = 'w';
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
