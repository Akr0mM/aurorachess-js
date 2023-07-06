import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import './home.html';

Template.home.events({
  'click .play-aurora'() {
    FlowRouter.go(`/play?against=aurora`);
  },
});
