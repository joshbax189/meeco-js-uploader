# Usage

This will save arbitrary JSON in a Meeco vault. For now, the JSON must be described by a JSON Schema file.

Run dev server with `npm start`, visit http://localhost:1234

1. Login with generated Meeco credentials (secret and password, edit src/index.js if you need a different vault URL).
2. Open JSON schema file for the data you wish to upload.
3. Clicking 'Push Templates' will create new ItemTemplates in the Vault that matches with the JSON schema.
4. Copy item JSON into the 'Data Input' textarea.
5. Clicking 'Convert to Item' will upload the JSON as a new collection of items. This is displayed in the 'Result Item' section.

I didn't add any polyfills, so this will probably only work on Chrome.

# How it Works

Each JSON object is transformed to an ItemTemplate.
Value properties (i.e. not objects or arrays) are made Slots in the ItemTemplate.
Arrays have their own ItemTemplate with name `json_array`. This has no predefined slots and is re-used for each array.
When an object has an array or object in a property, a new Slot is created which will reference the id of the child Item or Array.
The 'Push Templates' function recursively creates these objects and links the id's into Slots.

# TODO

- Accept server token (sandbox) and environment config
- Test w/ Sandbox
- Polyfills?
- Save Template button
- Load a Template
- JSON Schema Refs
  Try using jsonschema, or json-schema-ref-parser to deal with them
- Add other schema sources
  Swagger, Typed APIs (.d.ts), JSON guesser
- Try out embedded binding specs
- Try out decoding from Items
- Try out storing sub-Item references in description property
- Try using versioned name/label to circumvent no editing policy
- Integrate with CLI/SDK
- Clean UI
- Tests
- Rename and hide schema entries
