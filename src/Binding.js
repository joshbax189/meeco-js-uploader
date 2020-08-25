const Vault = require('@meeco/vault-api-sdk');
const LeafBinding = require('./LeafBinding');

function Binding(name, schemaObject) {
  this.name = name;
  this.schemaObject = schemaObject;

  this.slots = [];
  this.associated = [];
  this.children = [];
  for(k in schemaObject.properties) {
    //TODO address required props
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

  //Template:
  // 'id': json['id'],
  // 'name': json['name'],
  // 'description': json['description'],
  // 'ordinal': json['ordinal'],
  // 'visible': json['visible'],
  // 'user_id': json['user_id'],
  // 'updated_at': (new Date(json['updated_at'])),
  // 'image': json['image'],
  // 'template_type': json['template_type'],
  // 'classification_node_ids': json['classification_node_ids'],
  // 'association_ids': json['association_ids'],
  // 'associations_to_ids': json['associations_to_ids'],
  // 'slot_ids': json['slot_ids'],
  // 'label': json['label'],
  // 'background_color': json['background_color'],

  this.asItemTemplate = Vault.ItemTemplateFromJSON({name: name,
                                                    slots: this.slots,
                                                    description: schemaObject.description});
  //TODO not quite: Slots might need to be flattened
  //Format for SDK call
  this.getSlots = function () {
    return this.associated.reduce((acc, x) => acc.concat(x.getSlots()), this.slots).map(x => x.asSlot);
  };
}

module.exports = Binding;
