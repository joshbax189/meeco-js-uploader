"use strict";

const m = require('mithril');
const Meeco = require('@meeco/sdk');

const Binding = require('./Binding');
const LeafBinding = require('./LeafBinding');
const JSONComponent = require('./JSONComponent');
const BindingComponent = require('./BindingComponent');

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
  password: '',
  authData: {},
  vault: {}
};

//API factories, once logged in
//Note: Template creation is not defined in factory
let APIs = {};

//Eventual target for conversion to Item
let inputJSON = '{"familyName": "Jim","givenName": "Bob","honorificPrefix": [ "Hon.", "Dr.", "Mr" ],"email": {"type": "home","value": "jim.bob@email.com"}}';
//Generated binding
let workingBinding;

let authToken = sessionStorage.getItem(STORAGE_KEY);

//TODO create a template
function onAuth() {
  let userVault = vaultFactory(User.authData);
  APIs.ItemTemplateAPI = userVault.ItemTemplateApi;
  //alt
  APIs.SlotAPI = userVault.SlotApi;
  sessionStorage.setItem(STORAGE_KEY, User.authData.vault_access_token);
  console.log(APIs);
}

//Name -> Id map
let templateDict = {};

function getTemplateDict(vaultHost, token) {
    return m.request({
      method: 'GET',
      url: vaultHost + '/item_templates',
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(data => {
      let slotMap = data.slots.reduce((acc, x) => {
        acc[x.id] = x;
        return acc;
      }, {});
      //Name -> Id map
      templateDict = data.item_templates.reduce((acc, x) => {
        acc[x.name] = x;
        x.slots = x.slot_ids.map(y => slotMap[y]);
        return acc;
      }, {});
      console.log(templateDict);

      return templateDict;
    });
}

//TODO - until API call
let resultItems = [];

//TODO
// Use a binding to rewrite an instance of a schema
function transformData(binding, data) {
  // Walk the JSON and binding at the same time
  // Create Item instances as needed

  let itemSlotAttrs = [];

  //TODO special case if an array
  if (data instanceof Array) {
    for (let k in data) {
      itemSlotAttrs.push({
        name: binding.name + '_array_' + k,
        value: data[k]
      });
    }
  } else {
    for (let k in data) {
      let slotVal;
      if (binding.properties[k].type == 'item_template') {
        slotVal = transformData(binding.properties[k], data[k]); // this may trigger an API call
      } else {
        slotVal = data[k];
      }
      // TODO encode val
      let slotAttr = {
        name: binding.properties[k].name,
        label: 'optional',
        value: slotVal,
        //encrypted_value: 'TODO'
      };

      itemSlotAttrs.push(slotAttr);
    }
  }
  // Wait for any triggered API calls from children
  // Then trigger own call.

  let itemData = {
    label: '',
    template_name: binding.template_name,
    slots_attributes: itemSlotAttrs,
  };

  // POST this guy
  resultItems.push(itemData);
  return 'fake_item_id';
}

function convertItemHandler() {
  let data = JSON.parse(inputJSON);
  transformData(workingBinding.asJSONBinding(), data);
  console.log(resultItems);
  m.mount(document.getElementById('result-output'), JSONComponent(resultItems));
}

function readData(e) {
  //TODO check it's actually JSON
  //TODO report error if no JSON
  const f = e.target.files[0];
  const reader = new FileReader();

  reader.addEventListener('load', function (e) {
    let data = JSON.parse(e.target.result);
    workingBinding = new Binding(f.name.replace('.', '_'), data);
    console.log(workingBinding);
    m.mount(document.getElementById('outline'), BindingComponent(workingBinding));
  });
  reader.readAsText(f);
}

function pushTemplates() {
  getTemplateDict(environment.vault.url, authToken).then(dict => {
    workingBinding.pushTemplates(environment.vault.url, authToken, dict);
    m.mount(document.getElementById('template-output'), JSONComponent(workingBinding.asJSONBinding()));
  });
}

m.render(document.body, [
  m('div',
    m('form', {
      onsubmit: async function(e) {
        e.preventDefault();
        console.log(User);
        User.authData = await loginService.get(User.password, User.secret);
        console.log(User.authData);
        onAuth();
      }
    }, [
      m('h4', 'Meeco Auth'),
      m('input', {type: "text",
                  placeholder: "secret",
                  value: User.secret,
                  oninput: function (e) { User.secret = e.target.value; }}),
      m('input', {type: "password",
                  oninput: function (e) { User.password = e.target.value; }}),
      m('input', {type: "submit", value: "Go"}),
      m('button', {onclick: function() {
        sessionStorage.removeItem(STORAGE_KEY); authToken = ''
      }}, 'Clear Token'),
      m('p', authToken ? 'Token: ' + authToken : null),
    ])),
  m('.horiz', [
    m('div', [
      m('div', [
        m('h4', 'JSON schema'),
        m('input', {type: 'file', onchange: readData}),
      ]),
      m('#outline'),
      m('button', {onclick: pushTemplates}, 'Push Templates'),
    ]),
    m('div', [
      m('h4', 'Template Binding'),
      m('button', 'Save'),
      m('p#template-output', 'None')
    ]),
  ]),
  m('.horiz', [
    m('div', [
      m('h4', 'Data Input'),
      m('form', {
        onsubmit: function(e) {
          e.preventDefault();
          convertItemHandler();
        }
      }, [
        m('button[type="submit"]', "Convert to Item"),
        m('div',
          m('textarea.json-input', { oninput: function (e) { inputJSON = e.target.value; } },
           '{\n\
  "familyName": "Jim",\n\
  "givenName": "Bob",\n\
  "honorificPrefix": [ "Hon.", "Dr.", "Mr" ],\n\
  "email": {\n\
    "type": "home",\n\
    "value": "jim.bob@email.com"\n\
  }\
}'
)),
      ])
    ]),
    m('div', [
      m('h4', 'Result Item'),
      m('p#result-output', 'None')
    ])
  ])
]);
