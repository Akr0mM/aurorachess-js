import { Chess } from 'chess.js';

/* eslint-disable prefer-destructuring */
// eslint-disable-next-line import/prefer-default-export
export class Aurora {
  constructor(board, game, color, selfPlay) {
    this.MAX_DEPTH = 5;
    this.DEFAULT_DEPTH = 2;
    this.color = color;
    this.oppColor = this.color === 'w' ? 'b' : 'w';
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

    this.piecesScore = {
      k: 1000, // Roi
      q: 9, // Dame
      r: 5, // Tour
      n: 3, // Cavalier
      b: 3, // Four
      p: 1, // Pion
      m: 0.07, // Mobilité | Nombre de coups
    };
  }

  makeMove(depth) {
    if (this.gameIsOver()) return;
    console.log(this.searchMoves(depth));

    this.board.position(this.game.fen());
  }

  searchMoves(depth) {
    let moves = [];
    const gameFen = this.game.fen();
    const engine = new Chess(gameFen);

    engine.moves().forEach(move => {
      engine.load(gameFen);
      engine.move(move);
      moves.push({ moves: [move], scores: [this.getScore(engine.fen())] });
    });

    for (let i = 1; i < depth; i++) {
      const newMoves = [];
      moves.forEach(move => {
        engine.load(gameFen);
        for (let j = 0; j < move.moves.length; j++) {
          engine.move(move.moves[j]);
        }

        const fen = engine.fen();
        engine.moves().forEach(nextMove => {
          engine.load(fen);
          engine.move(nextMove);
          const push = { ...move };
          push.moves = move.moves.slice();
          push.scores = move.scores.slice();
          push.moves.push(nextMove);
          push.scores.push(this.getScore(engine.fen()));
          newMoves.push(push);
        });
      });
      moves = newMoves;
    }

    return moves;

    // ! VERSION 1 ! 1 ply : 95ms, 2 ply : 408ms, 3 ply : > 2000ms
    // const search = [];
    // const engine = new Chess(this.game.fen());
    // let levels = [];
    // for (let i = 0; i < depth; i++) {
    //   if (i === 0) {
    //     engine.load(this.game.fen());
    //     // eslint-disable-next-line no-loop-func
    //     engine.moves().forEach(move => {
    //       engine.load(this.game.fen());
    //       engine.move(move);
    //       const push = {
    //         move,
    //         score: this.getScore(engine.fen(), this.color),
    //         fen: engine.fen(),
    //       };
    //       if (depth > 1) push.moves = [];
    //       search.push(push);
    //       levels.push(push);
    //     });
    //   } else {
    //     // eslint-disable-next-line no-loop-func
    //     const nextLevels = [];
    //     levels.forEach(levelMove => {
    //       engine.load(levelMove.fen);
    //       engine.moves().forEach(move => {
    //         engine.load(levelMove.fen);
    //         engine.move(move);
    //         const push = {
    //           move,
    //           score: this.getScore(engine.fen(), this.color),
    //           fen: engine.fen(),
    //         };
    //         if (i !== depth - 1) push.moves = [];
    //         levelMove.moves.push(push);
    //         nextLevels.push(push);
    //       });
    //     });
    //     levels = nextLevels;
    //   }
    // }
    // return {
    //   search,
    //   length: levels.length,
    // };
  }

  getScore(fen) {
    const evaluation = new Chess(fen);
    evaluation._turn = this.color;
    const board = evaluation.board();
    let score = 0;
    let oppScore = 0;

    // score by pieces
    board.forEach(row => {
      row.forEach(square => {
        if (square && square.color === this.color) {
          score += this.piecesScore[square.type];
        } else if (square) {
          oppScore += this.piecesScore[square.type];
        }
      });
    });

    // score by mobility | number of moves
    const oppEvaluation = new Chess(fen);
    oppEvaluation._turn = this.color === 'w' ? 'b' : 'w';

    score += evaluation.moves().length * this.piecesScore.m;
    oppScore += oppEvaluation.moves().length * this.piecesScore.m;

    score -= oppScore;
    score = score.toFixed(3);
    return score;
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
