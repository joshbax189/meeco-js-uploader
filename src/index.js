"use strict";

import m from 'mithril';
import * as Meeco from '@meeco/sdk';

import Binding from './Binding.js';
import LeafBinding from './LeafBinding.js';
import BindingComponent from './BindingComponent.js';
import JSONComponent from './JSONComponent.js';
import TemplateSchemaStore from './TemplateSchemaStore.js';

const ACCESS_TOKEN = 'user_token';
const USER_DEK = 'user_dek';

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

let User = {
  secret: "1.4aBdw1.76BkP9-Wh6SFH-SLSboT-Ug82T4-61TJ6B-kajWc5-5vEUDe-jk",
  password: '',
  authData: {},
};

// TODO unused
//Note: Template creation is not defined in ItemTemplateAPI...
let APIs = {
  vaultFactory: Meeco.vaultAPIFactory(environment),
  ItemService: new Meeco.ItemService(environment),
  init: function () {

    // let userVault = APIs.vaultFactory(User.authData);
    // if (App.authToken) {
    //   APIs.ItemAPI = APIs.vaultFactory({vault_access_token: App.authToken}).ItemApi;
    // }

    // APIs.ItemTemplateAPI = userVault.ItemTemplateApi;
    // APIs.ItemAPI = userVault.ItemApi;
    // APIs.SlotAPI = userVault.SlotApi;
    console.log(APIs);
  }
};

// App state
let App = {
  //Target for conversion to Item
  inputJSON: '{"familyName": "Jim","givenName": "Bob","honorificPrefix": [ "Hon.", "Dr.", "Mr" ],"email": {"type": "home","value": "jim.bob@email.com"}}',
  authToken: sessionStorage.getItem(ACCESS_TOKEN),
  userDEK: Meeco.EncryptionKey.fromRaw(sessionStorage.getItem(USER_DEK)),
  loginService: new Meeco.UserService(environment),
  templates: null,
  //Name -> Id map
  templateDict: {},
  login: async function(accessToken) {
    console.log('begin auth');
    User.authData = await App.loginService.get(User.password, User.secret);
    console.log(User.authData);

    // APIs.init();

    sessionStorage.setItem(ACCESS_TOKEN, User.authData.vault_access_token);
    sessionStorage.setItem(USER_DEK, User.authData.data_encryption_key.key);
    App.authToken = User.authData.vault_access_token;
    App.userDEK = User.authData.data_encryption_key.key;
    App.templates = new TemplateSchemaStore(environment.vault.url, App.authToken);
  },
  logout: function() {
    sessionStorage.removeItem(ACCESS_TOKEN);
    sessionStorage.removeItem(USER_DEK);
    App.authToken = '';
    App.userDEK = '';
  },
};

if (App.authToken) {
  App.templates = new TemplateSchemaStore(environment.vault.url, App.authToken);
}

APIs.init();

//Generated binding
let workingBinding;

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

      App.templateDict = data.item_templates.reduce((acc, x) => {
        acc[x.name] = x;
        x.slots = x.slot_ids.map(y => slotMap[y]);
        return acc;
      }, {});
      console.log(App.templateDict);

      return App.templateDict;
    });
}

//TODO - until API call
let resultItems = [];

//TODO
// Use a binding to rewrite an instance of a schema
async function transformData(binding, data) {
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
        slotVal = await transformData(binding.properties[k], data[k]);
      } else {
        slotVal = data[k];
      }

      let slotAttr = {
        name: binding.properties[k].name,
        // label: 'optional',
        value: slotVal.toString(),
        //encrypted_value: 'TODO'
      };

      itemSlotAttrs.push(slotAttr);
    }
  }
  // Wait for any triggered API calls from children
  // Then trigger own call.

  let itemData = {
    // label: 'auto label ignore',
    item: { label: 'auto label ignore' }, //TODO correct?
    template_name: binding.template_name,
    slots: itemSlotAttrs,
  };

  // TODO encode vals - FML API clash
  //let newItem = await APIs.ItemService.create(App.authToken, App.userDEK, new Meeco.ItemCreateData(itemData));
  // try {

  let newItemResponse = await Promise.all(itemData.slots.map(function (slot) {
    return APIs.ItemService.encryptSlot(slot, App.userDEK);
  })).then(slots_attributes =>
    m.request({
      method: 'POST',
      url: environment.vault.url + '/items',
      headers: { 'Authorization': 'Bearer ' + App.authToken },
      body:{
        template_name: itemData.template_name,
        item: {
          label: itemData.item.label,
          slots_attributes: slots_attributes
        }
      }
    }));

  let newItem = newItemResponse.item;

  resultItems.push(newItem);
  return newItem.id;
  // } catch (e) {
  //   return Promise.reject(e);
  // }
}

async function convertItemHandler() {
  let data = JSON.parse(App.inputJSON);
  await transformData(workingBinding.toJSON(), data);
  console.log(resultItems);
  m.mount(document.getElementById('result-output'), JSONComponent(resultItems));
}

function pushTemplates() {
  getTemplateDict(environment.vault.url, App.authToken).then(() => {
    workingBinding.pushTemplates(App.templates);
    m.mount(document.getElementById('template-output'), JSONComponent(workingBinding.toJSON()));
  });
}

function JSONFileComponent(callback) {

  function fileJSONHandler(e) {
    const f = e.target.files[0];
    const reader = new FileReader();

    reader.addEventListener('load', function (e) {
      let data = JSON.parse(e.target.result);
      callback(f.name, data);
    });
    reader.readAsText(f);
  }

  return {
    view: () => m('input', {type: 'file', onchange: fileJSONHandler}),
  };
}

let inSchemaC = JSONFileComponent((name, data) => {
  workingBinding = new Binding(name.replace('.', '_'), data);
  m.mount(document.getElementById('outline'), BindingComponent(workingBinding));
});

let inBindingC = JSONFileComponent((name, data) => {
  m.mount(document.getElementById('template-output'), JSONComponent(data));
  //TODO implement Binding.fromJSON to generate this
});

m.render(document.body, [
  m('div', [
    m('h4', 'Meeco Auth'),
    m('input', {type: "text",
                placeholder: "secret",
                value: User.secret,
                oninput: function (e) { User.secret = e.target.value; }}),
    m('input', {type: "password",
                oninput: function (e) { User.password = e.target.value; }}),
    m('button', {onclick: App.login}, 'Go'),
    m('button', {onclick: App.logout}, 'Clear Token'),
    m('p', App.authToken ? 'Token: ' + App.authToken : null),
  ]),
  m('.horiz', [
    m('div', [
      m('div', [
        m('h4', 'JSON schema'),
        m(inSchemaC),
      ]),
      m('#outline'),
      m('button', {onclick: pushTemplates}, 'Push Templates'),
    ]),
    m('div', [
      m('h4', 'Template Binding'),
      m('button', 'Save'),
      m(inBindingC),
      m('p#template-output', 'None')
    ]),
  ]),
  m('.horiz', [
    m('div', [
      m('h4', 'Data Input'),
      m('button', {onclick: convertItemHandler}, "Convert to Item"),
      m('div',
        m('textarea.json-input', { oninput: function (e) { App.inputJSON = e.target.value; } },
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
    ]),
    m('div', [
      m('h4', 'Result Item'),
      m('p#result-output', 'None')
    ])
  ])
]);
