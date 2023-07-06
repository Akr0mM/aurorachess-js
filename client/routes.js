import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

const route = name => FlowRouter.route(`/${name}`, {
  name,
  action() {
    BlazeLayout.render('layout', { mainTemplate: name });
  },
});

FlowRouter.route('/', {
  triggersEnter: [
    function (context, redirect) {
      FlowRouter.withReplaceState(() => {
        redirect('/home');
      });
    },
  ],
});

FlowRouter.route('/home', {
  name: 'home',
  action() {
    // if (!Meteor.userId()) FlowRouter.redirect('/login');
    BlazeLayout.render('layout', { mainTemplate: 'home' });
  },
});

FlowRouter.route('/:play', {
  name: 'play',
  action() {
    BlazeLayout.render('layout', { mainTemplate: 'play' });
  },
});

route('login');
route('register');
