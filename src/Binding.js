//import template, slot from compiled SDK
// const Meeco = require('@meeco/vault-api-sdk');
const Vault = require('@meeco/vault-api-sdk');

function LeafBinding(name, schemaType) {
  this.name = name;
  this.schemaType = schemaType;

  //Slot API:
  // 'id': json['id'],
  // 'own': json['own'],
  // 'share_id': json['share_id'],
  // 'name': json['name'],
  // 'description': json['description'],
  // 'encrypted': json['encrypted'],
  // 'ordinal': json['ordinal'],
  // 'visible': json['visible'],
  // 'classification_node_ids': json['classification_node_ids'],
  // 'attachment_ids': json['attachment_ids'],
  // 'slotable_id': json['slotable_id'],
  // 'slotable_type': json['slotable_type'],
  // 'required': json['required'],
  // 'updated_at': (new Date(json['updated_at'])),
  // 'created_at': (new Date(json['created_at'])),
  // 'slot_type_name': json['slot_type_name'],
  // 'creator': json['creator'],
  // 'encrypted_value': json['encrypted_value'],
  // 'image': json['image'],
  // 'label': json['label'],

  this.asSlot = Vault.SlotFromJSON({name: name, slot_type_name: schemaType});
}

function Binding(name, schemaObject) {
  this.name = name;
  this.schemaObject = schemaObject;

  this.slots = [];
  this.associated = [];
  for(k in schemaObject) {
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

  this.asItemTemplate = Vault.TemplateFromJSON({name: name, slots: slots});
  //TODO not quite: Slots might need to be flattened
  //Format for SDK call
}

module.exports = Binding;
