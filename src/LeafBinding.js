'use strict';

/**
 * Binding for a JSON schema object with no children, i.e. where type != object or array.
 * This becomes a Slot in an Item or ItemTemplate.
 */
export default function LeafBinding(name, schemaObject, required) {
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

  /**
   * Return A JSON object that describes the binding.
   * Base case is just a Slot with a name, but Arrays and
   * references need special handling.
   */
  this.asJSONBinding = function() {
    if (this.schemaType == 'array') {
      // TODO there should be a single Array ItemTemplate that is used in every schema
      return {
        // TODO this should probably be an instance of Binding!!
        // name: this.name,
        name: 'json_array',
        template_name: 'json_array',
        // id: 'special_id_of_array_template',
        type: 'item_template',
        items: {
          type: this.schema.items['type']
        }
      };
    } else if (this.schemaType == 'reference') {
      return {
        name: this.name,
        id: 'TODO_external_template_id',
        description: this.description,
        type: 'item_template'
      };
    } else {
      return {
        name: this.name,
        type: 'slot'
      };
    }
  };
}

/**
 * Format type information for storing in Slot.description property
 */
function serializeType(typeString) {
  return 'type:' + typeString;
}
