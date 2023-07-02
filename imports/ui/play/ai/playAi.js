// import { Chess } from 'chess.js';
import { Template } from 'meteor/templating';

import './playAi.html';

document.title = 'Play Aurora AI';

Template.playai.onRendered(() => {
  const config = {
    pieceTheme: '/img/chesspieces/wikipedia/{piece}.png',
    position: 'start',
  };
  // eslint-disable-next-line new-cap, no-undef
  Chessboard('board', config);
});
