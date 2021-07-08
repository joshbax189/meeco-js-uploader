let m = require('mithril');

// A Schema binding binds a JSON schema location to a Slot/Item and records the setting: hide/visit/rename



function SchemaBinding(name, value) {
  // init step
  let isNode = value && typeof value == 'object' && !value.isArray;
  let divClass = isNode ? '.node' : '.leaf';

  // if (isNode) {
  //   let inner = Object.entries(objValue).map(x =>
  //     m(divClass, [
  //      name.toString()+': ',
  //      m(mapControlC),
  //      (x[1] && typeof x[1] == 'object' && !x[1].isArray) ? m(mkDataC(x[1])) : m(mkLeafC(x[1])),
  //               ]));

  //   return {
  //     view: function() {
  //       return m(divClass, [

  //       ]);
  //     }
  //   };
  // } else {
  //   return {
  //     view: function() {
  //       return m(divClass, value.toString());
  //     }
  //   };
  // }
}
