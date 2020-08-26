const Vault = require('@meeco/vault-api-sdk');
const LeafBinding = require('./LeafBinding');
const m = require('mithril');

function Binding(name, schemaObject) {
  this.name = name;
  this.schemaObject = schemaObject;
  this.hidden = false;

  this.slots = []; //Children which are LeafSlots PLUS key_value type slots representing Bindings
  this.associated = []; // Children which are Bindings
  this.children = []; // All properties of this object
  for(k in schemaObject.properties) {
    //TODO address required props, but required prop in ItemTemplate is broken...
    //TODO references!

    // if an object
    let target = schemaObject.properties[k];
    if (target && typeof target == 'object' && target.type == 'object') {
      // create a link slot
      this.slots.push(new LeafBinding(k, {type: 'key_value'}));
      // create a Binding
      let b = new Binding(k, target);
      this.associated.push(b);
      this.children.push(b);
    } else if (target.type == 'array') {
      //TODO special case if object is a list
      let b = new LeafBinding(k, {type: 'array', description: target.items.type});
      this.slots.push(b);
      this.children.push(b);
    } else {
      let b = new LeafBinding(k, target);
      this.slots.push(b);
      this.children.push(b);
    }
  }

  this.asItemTemplate = Vault.ItemTemplateFromJSON({name: name,
                                                    slots: this.slots,
                                                    description: schemaObject.description});

  this.asTemplateData = function () {
    return { label: this.name,
             name: this.name,
             description: this.schemaObject.description,
             slots_attributes: this.slots.map(x => x.asSlotData())
           };
  }

  this.getSlots = function () {
    return this.associated.reduce((acc, x) => acc.concat(x.getSlots()), this.slots).map(x => x.asSlot);
  };

  //TODO originally used in asJSONBinding, unused now
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
  }

  // Call SDK services to create all needed Templates
  // Update in place with responses
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

    for (t in this.associated) {
      this.associated[t].pushTemplates(vaultHost, token, templateDict);
    }
  }

  this.template = { id: 123 };

  // Record ItemTemplate and Slot ids against their JSON paths
  this.asJSONBinding = function() {
    //let slotMap = this.getSlotsMap();
    let propMap = this.children.reduce((acc, x) => {
      if (x instanceof LeafBinding) {
        // TODO what if array
        if (x.schemaType == 'array') {
          acc[x.name] = {
            name: x.name,
            id: 'special_id_of_array_template',
            type: 'item_template',
            items: {
              type: 'TODO'
            }
          };
        } else if (x.schemaType == 'reference') {
          acc[x.name] = {
            name: x.name,
            id: 'TODO_external_template_id',
            type: 'item_template'
          };
        } else {
          acc[x.name] = {
            name: x.name,
            type: 'slot'
          };
        }
      } else {
        acc[x.name] = x.asJSONBinding();
      }
      return acc;
    }, {});

    return {
      //label: this.name,
      type: 'item_template',
      id: this.template.id,
      template_name: this.name,
      properties: propMap
    };
  }
}

module.exports = Binding;
