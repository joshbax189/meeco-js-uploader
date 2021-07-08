"use strict";

import m from 'mithril';
import * as Meeco from '@meeco/sdk';

import { Binding, JSONSchemaToBinding } from './Binding.js';
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
  secret: '1.ex12Q9.jgqgd2-kE6iKA-eYi7zV-B4R48D-m5KZk9-9qSYhQ-pfaj4i-3',
  password: '',
  login: async function() {
    let service = new Meeco.UserService(environment);
    console.log('begin auth');
    try {
      let authData = await service.get(User.password, User.secret);
      console.log(User.authData);
      return authData;
    } catch(err) {
      alert(err);
      console.log(err);
    }
    return {};
  },
};

// App state
let App = {
  //Target for conversion to Item
  inputJSON: '{"familyName": "Jim","givenName": "Bob","honorificPrefix": [ "Hon.", "Dr.", "Mr" ],"email": {"type": "home","value": "jim.bob@email.com"}}',
  authToken: sessionStorage.getItem(ACCESS_TOKEN),
  userDEK: Meeco.EncryptionKey.fromRaw(sessionStorage.getItem(USER_DEK)),

  ItemService: new Meeco.ItemService(environment),
  templates: null,
  //Generated binding
  workingBinding: null,
  //TODO - until API call
  resultItems: [],

  login: async function(accessToken) {
    let authData = await User.login();
    let token = authData.vault_access_token;
    let dek = authData.data_encryption_key.key;

    sessionStorage.setItem(ACCESS_TOKEN, token);
    sessionStorage.setItem(USER_DEK, dek);
    App.authToken = token;
    App.userDEK = dek;
    App.templates = new TemplateSchemaStore(environment.vault.url, token);
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
  //let newItem = await App.ItemService.create(App.authToken, App.userDEK, new Meeco.ItemCreateData(itemData));
  // try {

  let newItemResponse = await Promise.all(itemData.slots.map(function (slot) {
    return App.ItemService.encryptSlot(slot, App.userDEK);
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

  App.resultItems.push(newItem);
  return newItem.id;
  // } catch (e) {
  //   return Promise.reject(e);
  // }
}

async function convertItemHandler() {
  let data = JSON.parse(App.inputJSON);
  await transformData(App.workingBinding.toJSON(), data);
  console.log(App.resultItems);
  m.mount(document.getElementById('result-output'), JSONComponent(App.resultItems));
}

let DLButton = {
  oninit: function(v) {
	  v.state.name = 'binding.json';
	  v.state.data = '';
	  v.state.updateData = () => {
	    v.state.data = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(App.workingBinding.toJSON()));
	  }
  },
  view: function(v) {
	  return [
	    m('a', {
		    download: v.state.name,
		    href: v.state.data,
		    onclick: v.state.updateData,
	    }, m('button', 'Save Locally')),
	    m('input', {
		    type: 'text/json',
		    required: true,
        value: v.state.name,
		    oninput: e => v.state.name = e.target.value
	    }),
	  ];
  }
}

function pushTemplates() {
  if (!App.authToken) {
    alert('Not Authorised!');
    throw Error('Not Authorised');
  }

  App.templates.loadTemplates().then(() => {
    App.workingBinding.pushTemplates(t => App.templates.saveUnlessExists(t));
    m.mount(document.getElementById('template-output'), JSONComponent(App.workingBinding.toJSON()));
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
  App.workingBinding = JSONSchemaToBinding(name.replace('.', '_'), data);
  m.mount(document.getElementById('outline'), BindingComponent(App.workingBinding));
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
    App.authToken ? m('p', 'Token: ' + App.authToken) : null,
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
      m(DLButton),
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
