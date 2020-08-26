"use strict";

const m = require('mithril');

const Binding = require('./Binding');
const LeafBinding = require('./LeafBinding');

let mapControlC = {
  view: () => m('span', [
    m('button', 'Hide'),
  ])
};

function BindingComponent(binding) {
  if (binding instanceof Binding) {
    let inner = binding.children.map(x => m(BindingComponent(x)));
    return {
      view: () =>
      m('.node', [
        m('input', {type: 'text', value: binding.name}),
        ': ',
        m('.obj', inner),
        m(mapControlC),
      ])
    };
  } else if (binding instanceof LeafBinding) {
    return {
      view: () => m('.node', [
        m('input', {type: 'text', value: binding.name}),
        ': ',
        m('.leaf', binding.schemaType),
        m(mapControlC),
      ])
    };
  }
}

module.exports = BindingComponent;
