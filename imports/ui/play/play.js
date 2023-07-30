/* eslint-disable no-alert */
import { Template } from 'meteor/templating';
import { Aurora } from '../aurora/aurora';

import './play.html';
import './play.css';

const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

let shiftKey = false;

$(document).on('keydown keyup', event => {
  if (event.shiftKey) {
    shiftKey = true;
  } else {
    shiftKey = false;
  }
});

Template.play.onRendered(() => {
  let board = null;
  let aurora = null;

  function onDragStart(source, piece) {}

  // eslint-disable-next-line consistent-return
  function onDrop(source, target, piece) {
    // $('.highlight-moves-white').removeClass('highlight-moves-white');
    // $('.highlight-moves-black').removeClass('highlight-moves-black');
    // $('.highlight-moves-source-white').removeClass(
    //   'highlight-moves-source-white',
    // );
    // $('.highlight-moves-source-black').removeClass(
    //   'highlight-moves-source-black',
    // );
  }

  // eslint-disable-next-line consistent-return
  function onSnapEnd() {}

  const boardConfig = {
    pieceTheme: '/chesspieces/neo/{piece}.png',
    draggable: true,
    position: fen,
    onDragStart,
    onDrop,
    onSnapEnd,
  };

  // eslint-disable-next-line new-cap, no-undef
  board = Chessboard('board', boardConfig);

  const config = {
    fen,
    board,
  };

  aurora = new Aurora(config);
});
