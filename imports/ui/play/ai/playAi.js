/* eslint-disable new-cap */
/* eslint-disable no-unused-vars */
import { Chess } from 'chess.js';
import { Template } from 'meteor/templating';

import './playAi.html';
import './playAi.css';

class Aurora {
  constructor(board, game, moveLogics, selfPlay) {
    this.board = board;
    this.game = game;
    this.moveLogics = moveLogics;
    this.selfPlay = selfPlay;
    this.autoPlaySpeed = 400;
    this.play = true;
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

    const priorityMoves = [];
    this.moveLogics.forEach(logic => {
      let moves;
      if (logic === 'take') moves = this.moveTake();
      priorityMoves.push(...moves);
    });

    let move;
    if (priorityMoves.length === 1) {
      move = priorityMoves[0];
    } else if (priorityMoves.length > 1) {
      move = priorityMoves[Math.floor(Math.random() * priorityMoves.length)];
    } else {
      const randomMoves = this.game.moves();
      move = randomMoves[Math.floor(Math.random() * randomMoves.length)];
    }

    this.game.move(move);
  }

  moveTake() {
    const moves = this.game.moves();
    const priorityMoves = [];

    moves.forEach(move => {
      if (move.includes('x')) priorityMoves.push(move);
    });

    return priorityMoves;
  }

  autoPlay(board) {
    this.makeMove();
    board.position(this.game.fen());
    if (this.play) window.setTimeout(() => this.autoPlay(board), this.autoPlaySpeed);
  }
}

Template.playai.onRendered(() => {
  let board = null;
  const game = new Chess();
  const aurora = new Aurora(board, game, ['take'], false);

  function onDragStart(source, piece, position, orientation) {}

  // eslint-disable-next-line consistent-return
  function onDrop(source, target, piece, position) {
    const from = source;
    const to = target;

    try {
      const move = game.move({ from, to, promotion: 'q' });

      if (move === null) {
        throw new Error('Mouvement invalide');
      }
      // move valide
    } catch (error) {
      // move invalide

      return 'snapback';
    }
  }

  // eslint-disable-next-line consistent-return
  function onSnapEnd() {
    aurora.makeMove();
    board.position(game.fen());
    if (game.isCheckmate()) {
      if (game.turn() === 'w') return console.log('Black won');
      else return console.log('White won');
    }

    if (
      game.isDraw() ||
      game.isInsufficientMaterial() ||
      game.isStalemate() ||
      game.isThreefoldRepetition()
    ) {
      console.log('Draw');
    }
  }

  const config = {
    pieceTheme: '/img/chesspieces/wikipedia/{piece}.png',
    draggable: true,
    position: 'start',
    promotion: 'q',
    onDragStart,
    onDrop,
    onSnapEnd,
  };

  // eslint-disable-next-line no-undef
  board = Chessboard('myBoard', config);
  if (aurora.selfPlay) aurora.autoPlay(board);
});
