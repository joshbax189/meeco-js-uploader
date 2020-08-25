"use strict";

const m = require('mithril');
const Meeco = require('@meeco/sdk');

const Binding = require('./Binding');

const environment = {
  vault: {
    url: 'http://localhost:3000',
    subscription_key: '',
  },
  keystore: {
    url: 'http://localhost:4000',
    subscription_key: '',
  }
};

const loginService = new Meeco.UserService(environment);

let mapControlC = {
  view: () => m('span', [
    m('button', 'Hide'),
    // m('button', 'Visit'),
    // m('button', 'Rename')
  ])
};

function mkDataComponent(obj) {
  let inner = Object.entries(obj).map(x =>
    m('.node', [
      m('input', {type: 'text', value: x[0].toString()}),
      ': ',
      (x[1] && typeof x[1] == 'object' && !x[1].isArray) ? m(mkDataComponent(x[1])) : m(mkLeafC(x[1])),
      m(mapControlC),
    ]));
  return {
    view: () => m('.obj', /*{key: obj}, */ inner)
  };
}

function mkLeafC(leafValue) {
  let inner = leafValue.toString();
  return {
    view: () => m('.leaf', inner)
  };
}

let User = {
  secret: "1.4aBdw1.76BkP9-Wh6SFH-SLSboT-Ug82T4-61TJ6B-kajWc5-5vEUDe-jk",
  password: ''
};

let userAuth;

function readData(e) {
  //TODO check it's actually JSON
  //TODO report error if no JSON
  const f = e.target.files[0];
  const reader = new FileReader();

  reader.addEventListener('load', function (e) {
    data = JSON.parse(e.target.result);
    console.log(data);
    console.log(new Binding(f.name, data));
    m.mount(document.getElementById('outline'), mkDataComponent(data));
  });
  reader.readAsText(f);
}

m.render(document.body, [
  m('div', [
    m('label', 'JSON schema'),
    m('input', {type: 'file', onchange: readData}),
  ]),
  m('#outline'),
  m('div',
    //action GET /users
    m('form', {
      onsubmit: async function(e) {
        e.preventDefault();
        console.log(User);
        userAuth = await loginService.get(User.password, User.secret);
        console.log(userAuth);
      }
    }, [
      m('h4', 'Meeco Auth'),
      // TODO must submit via Meeco SDK
      // m('input', {type: "text", placeholder: "username"}),
      m('input', {type: "text",
                  placeholder: "secret",
                  value: "1.4aBdw1.76BkP9-Wh6SFH-SLSboT-Ug82T4-61TJ6B-kajWc5-5vEUDe-jk",
                  oninput: function (e) { User.secret = e.target.value; }}),
      m('input', {type: "password",
                  oninput: function (e) { User.password = e.target.value; }}),
      m('input', {type: "submit", value: "Go"}),
    ]))
]);
