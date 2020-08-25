"use strict";

const m = require('mithril');
const Meeco = require('@meeco/sdk');

const Binding = require('./Binding');
const LeafBinding = require('./LeafBinding');

const STORAGE_KEY = 'user_token';

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
const vaultFactory = Meeco.vaultAPIFactory(environment);

let User = {
  secret: "1.4aBdw1.76BkP9-Wh6SFH-SLSboT-Ug82T4-61TJ6B-kajWc5-5vEUDe-jk",
  password: ''
};
let userAuth;
//Eventual target for conversion to Item
let inputJSON = '';

let authToken = sessionStorage.getItem(STORAGE_KEY);

//TODO create a template
function onAuth() {
  userVault = vaultFactory(userAuth);
  ItemTemplateAPI = userVault.ItemTemplateApi;
  //alt
  SlotAPI = userVault.SlotApi;
  sessionStorage.setItem(STORAGE_KEY, userAuth.vault_access_token);
  console.log(SlotAPI);
}

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


function readData(e) {
  //TODO check it's actually JSON
  //TODO report error if no JSON
  const f = e.target.files[0];
  const reader = new FileReader();

  reader.addEventListener('load', function (e) {
    m.mount(document.getElementById('outline'), mkDataComponent(data));
    let data = JSON.parse(e.target.result);
    // console.log(data);
    let binding = new Binding(f.name, data);
    console.log(binding);
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
    m('form', {
      onsubmit: async function(e) {
        e.preventDefault();
        console.log(User);
        userAuth = await loginService.get(User.password, User.secret);
        console.log(userAuth);
        onAuth();
      }
    }, [
      m('h4', 'Meeco Auth'),
      m('input', {type: "text",
                  placeholder: "secret",
                  value: "1.4aBdw1.76BkP9-Wh6SFH-SLSboT-Ug82T4-61TJ6B-kajWc5-5vEUDe-jk",
                  oninput: function (e) { User.secret = e.target.value; }}),
      m('input', {type: "password",
                  oninput: function (e) { User.password = e.target.value; }}),
      m('input', {type: "submit", value: "Go"}),
    ]))
]);
