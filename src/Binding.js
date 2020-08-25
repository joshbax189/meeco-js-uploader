const Vault = require('@meeco/vault-api-sdk');
const LeafBinding = require('./LeafBinding');

function Binding(name, schemaObject) {
  this.name = name;
  this.schemaObject = schemaObject;

  this.slots = [];
  this.associated = [];
  for(k in schemaObject) {
    if (k[0] == '$' || k == 'type') {
      continue;
    }

    // if an object
    let target = schemaObject[k];
    if (target && typeof target == 'object') {
      // create a link slot
      this.slots.push(new LeafBinding(k, 'key_value'));
      // create a Binding
      this.associated.push(new Binding(k, target));
      //TODO special case if object is a list
    } else {
      this.slots.push(new LeafBinding(k, target));
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
}

module.exports = Binding;
