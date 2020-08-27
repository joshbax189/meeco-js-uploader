'use strict';

const LeafBinding = require('./LeafBinding');
const m = require('mithril');

/**
 * Binds a JSONSchema given by schemaObject to an ItemTemplate specified by name.
 * Creates the ItemTemplate if needed.
 */
function Binding(name, schemaObject) {
  this.name = name;
  this.schemaObject = schemaObject;
  // Do not create an ItemTemplate or include this among the Slots of the parent Item.
  this.hidden = false;
  // Store any existing ItemTemplate data here
  this.template = { id: 123 };

  // All properties of this object as Bindings or LeafBindings
  this.children = [];
  // Children which are LeafSlots PLUS key_value type slots representing Bindings
  this.slots = [];
  // Subset of this.children which are Bindings (not LeafBindings)
  this.associated = [];

  for(let k in schemaObject.properties) {
    //TODO address required props, but required prop in ItemTemplate is broken...
    //TODO references!

    let target = schemaObject.properties[k];
    if (target.type == 'object') {
      // create a link slot
      this.slots.push(new LeafBinding(k, {type: 'key_value'}));
      // create a Binding
      let b = new Binding(k, target);
      this.associated.push(b);
      this.children.push(b);
    } else {
      // Note that Arrays are handled elsewhere
      let b = new LeafBinding(k, target);
      this.slots.push(b);
      this.children.push(b);
    }
  }

  /** Generate POST data for /items_templates */
  this.asTemplateData = function () {
    return { label: this.name,
             name: this.name,
             description: this.schemaObject.description,
             slots_attributes: this.slots.map(x => x.asSlotData())
           };
  };

  this.raw_slots = [];
  // Depends on template data
  // TODO try make it an async
  this.getSlotsMap = function() {
    if (this.template.slots) {
      return this.template.slots;
    } else {
      // raw_slots an array of Slots
      return this.raw_slots.reduce((acc, slot) => {
        acc[slot.name] = slot;
        return acc;
      }, {});
    }
  };

  /**
   * Call SDK services to create all needed Templates
   * Update in place with responses
   */
  this.pushTemplates = function (vaultHost, token, templateDict) {
    console.log(this.asTemplateData());
    //TODO if exist, do PUT instead
    let authHeader = { 'Authorization': 'Bearer ' + token };

    // Test existence

    // If exist
    if (templateDict[this.name]) {
      // alert('whoops it exists!');
      this.template = templateDict[this.name];
    } else {
      m.request({
        method: 'POST',
        url: vaultHost + '/item_templates',
        headers: authHeader,
        body: this.asTemplateData()
      }).then(data => {
        console.log(data);
        this.template = data.item_template;
        this.raw_slots = data.slots;
      });
    }

    for (let t in this.associated) {
      this.associated[t].pushTemplates(vaultHost, token, templateDict);
    }
  };

  /** Record ItemTemplate and Slot ids against their JSON paths */
  this.asJSONBinding = function() {
    //let slotMap = this.getSlotsMap();
    let propMap = this.children.reduce((acc, x) => {
      acc[x.name] = x.asJSONBinding();
      return acc;
    }, {});

    return {
      //label: this.name,
      type: 'item_template',
      id: this.template.id,
      template_name: this.name,
      properties: propMap
    };
  };
}

module.exports = Binding;
