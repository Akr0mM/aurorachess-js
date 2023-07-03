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
    const simulation = new Chess();
    let moves;
    const levels = [];
    let bestMove;
    const depth = $('#depth-input').val();

    for (let i = 0; i < depth; i++) {
      if (i === 0) {
        simulation.load(fen);
        moves = simulation.moves();
        moves.forEach(move => {
          levels.push({ move, depth: 1, nextLevel: [] });
        });
      } else {
        // eslint-disable-next-line no-loop-func
        levels.forEach(move => {
          while (move.nextLevel) {
            move = move.nextLevel;
          }
          simulation.load(fen);
          simulation.move(move.move);
          moves = simulation.moves();
          moves.forEach(nextMove => {
            const push = {
              move: nextMove,
              depth: i + 1,
              moves: [move.move, nextMove],
            };
            if (i === depth - 1) {
              simulation.move(nextMove);
              push.evaluation = this.evaluateStaticPosition(simulation.fen());
              simulation.undo();
            } else {
              push.nextLevel = [];
            }
            move.nextLevel.push(push);
          });
        });
      }
    }

    console.log(levels);
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
    return (whitePoints - blackPoints).toFixed(5);
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
