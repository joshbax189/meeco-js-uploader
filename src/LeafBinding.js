const Vault = require('@meeco/vault-api-sdk');

function LeafBinding(name, schemaObject, required) {
  this.name = name;
  this.schema = schemaObject;
  if (this.schema.$ref) {
    this.schemaType = 'reference';
    this.description = this.schema.$ref;
  } else {
    this.schemaType = this.schema.type;
    this.description = this.schema.description;
  }
  this.required = required || false;

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

  this.asSlot = Vault.SlotFromJSON({name: name,
                                    slot_type_name: this.schemaType,
                                    description: this.description,
                                    required: this.required});
}

module.exports = LeafBinding;
