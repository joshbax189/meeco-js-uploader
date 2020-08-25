const m = require('mithril');

function JSONComponent(obj) {
  if (typeof obj == 'object') {
    let inner = Object.entries(obj).map(x => m('.node', [
      m('span', x[0]),
      ': ',
      m(JSONComponent(x[1])),
      ','
    ]));
    if (obj instanceof Array) {
      return {
        view: () => [ '[', m('.obj', inner), ']']
      };
    } else {
      return {
        view: () => [ '{', m('.obj', inner), '}' ],
      };
    }
  } else {
    return {
      view: () => m('span', obj.toString())
    };
  }
}

module.exports = JSONComponent;
