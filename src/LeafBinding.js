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

  this.asSlot = Vault.SlotFromJSON({name: name,
                                    slot_type_name: this.schemaType,
                                    description: this.description,
                                    required: this.required});

  this.asSlotData = function () {
    return {
      name: this.name,
      label: this.description || this.name,
      slot_type_name: 'key_value', //TODO is this an ok default?
      // description: this.description,
      description: serializeType(this.schemaType)
      //required: this.required //Cannot set
    };
  };
}

function serializeType(typeString) {
  return 'type:'+typeString;
}

module.exports = LeafBinding;
