'use strict';

import { RefSlot, ArraySlot, BasicSlot } from './Slottable.js';

/**
 * Binds a JSONSchema given by schemaObject to an ItemTemplate specified by name.
 * Creates the ItemTemplate if needed.
 */
export default class Binding {

  constructor(name, schemaObject) {
    this.name = name;
    this.schemaObject = schemaObject;
    //Use label to resolve references
    if (schemaObject.$id) {
      this.label = schemaObject.$id;
    }
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
        this.slots.push(new RefSlot(k, 'pointer to object ' + k));
        // create a Binding
        let b = new Binding(k, target);
        this.associated.push(b);
        this.children.push(b);
      } else if (target.type == 'array') {
        let b = new ArraySlot(k, target.description, target.type, target.items.type);
        this.slots.push(b);
        this.children.push(b);
      } else if (target.$ref) {
        let b = new RefSlot(k, target.$ref, 'reference');
        this.slots.push(b);
        this.children.push(b);
      } else {
        let b = new BasicSlot(k, target.description, target.type);
        this.slots.push(b);
        this.children.push(b);
      }
    }
  }

  /** Generate POST data for /items_templates */
  asTemplateData () {
    return { label: this.name,
             name: this.name,
             description: this.schemaObject.description,
             slots_attributes: this.slots.map(x => x.asSlotData())
           };
  }

  /**
   * Call SDK services to create all needed Templates
   * Update in place with responses
   * @param saveTemplateCallback POST the new template and return it.
   */
  async pushTemplates(saveTemplateCallback) {
    this.template = await saveTemplateCallback(this.asTemplateData());

    for (let t in this.associated) {
      this.associated[t].pushTemplates(saveTemplateCallback);
    }
  };

  /** Record ItemTemplate and Slot ids against their JSON paths */
  toJSON() {
    let propMap = this.children.reduce((acc, x) => {
      acc[x.name] = x.toJSON();
      return acc;
    }, {});

    return {
      //label: this.name,
      name: this.name,
      type: 'item_template',
      // id: this.template.id,
      template_name: this.name,
      properties: propMap
    };
  };
}
