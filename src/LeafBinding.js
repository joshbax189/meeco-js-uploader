'use strict';

/**
 * Binding for a JSON schema object with no children, i.e. where type != object or array.
 * This becomes a Slot in an Item or ItemTemplate.
 */
function LeafBinding(name, schemaObject, required) {
  this.name = name;
  // The original JSONSchema
  this.schema = schemaObject;
  this.required = required || false;

  // TODO schemaType and description are not used
  if (this.schema.$ref) {
    this.schemaType = 'reference';
    this.description = this.schema.$ref;
  } else {
    this.schemaType = this.schema.type;
    this.description = this.schema.description;
  }

  // Meant to be used in the slots_attributes list
  this.asSlotData = function () {
    return {
      name: this.name,
      label: this.description || this.name,
      slot_type_name: 'key_value',
      description: serializeType(this.schemaType)
      //required: this.required //Cannot set
    };
  };
}

/**
 * Format type information for storing in Slot.description property
 */
function serializeType(typeString) {
  return 'type:' + typeString;
}

module.exports = LeafBinding;
