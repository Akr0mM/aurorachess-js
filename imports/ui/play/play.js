/* eslint-disable no-alert */
import { Template } from 'meteor/templating';
import { Aurora } from '../aurora/aurora';

import './play.html';
import './play.css';

// const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const fen = 'p1p1p1p1/PPPPPPPP/8/8/8/8/pppppppp/1P1P1P1P w - - 0 1';

let aurora = null;

$(document).on('keydown keyup', event => {
  if (event.shiftKey) {
    aurora.shiftKey = true;
  } else {
    aurora.shiftKey = false;
  }
});

Template.play.onRendered(() => {
  console.clear();

  let board = null;

  $('#undo-button').on('click', () => {
    if (aurora.undoHistory.length !== 0) {
      aurora.undoMove();
      board.position(aurora.getFEN());
      board.resize();
    }
  });

  function onDragStart(source, piece) {}

  // eslint-disable-next-line consistent-return
  function onDrop(source, target) {
    if (source === 'offboard' || target === 'offboard') return 'snapback';
    const move = aurora.isLegalMove(source, target);
    if (move) {
      aurora.playMove(move);
    } else {
      return 'snapback';
    }
  }

  // eslint-disable-next-line consistent-return
  function onSnapEnd() {
    board.position(aurora.getFEN());
  }

  const boardConfig = {
    pieceTheme: '/chesspieces/neo/{piece}.png',
    draggable: true,
    position: fen,
    onDragStart,
    onDrop,
    onSnapEnd,
    moveSpeed: 0,
    snapSpeed: 0,
  };

  // eslint-disable-next-line new-cap, no-undef
  board = Chessboard('board', boardConfig);

  const config = {
    fen,
    board,
  };

  aurora = new Aurora(config);
});
