/* eslint-disable new-cap */
/* eslint-disable no-unused-vars */
import { Chess } from 'chess.js';
import { Template } from 'meteor/templating';

import './playAi.html';
import './playAi.css';

Template.playai.onRendered(() => {
  let board = null;
  const game = new Chess();

  function onDragStart(source, piece, position, orientation) {}

  function onDrop(source, target, piece, position) {}

  function onSnapEnd() {}

  const config = {
    pieceTheme: '/img/chesspieces/wikipedia/{piece}.png',
    draggable: true,
    position: 'start',
    onDragStart,
    onDrop,
    onSnapEnd,
  };

  // eslint-disable-next-line no-undef
  board = Chessboard('myBoard', config);

  function makeRandomMove() {
    const moves = game.moves();
    const move = moves[Math.floor(Math.random() * moves.length)];
    game.move(move);
    board.position(game.fen());
    if (!game.isGameOver()) window.setTimeout(makeRandomMove, 250);
  }

  makeRandomMove();
});
