/**
 * Created by semen on 26.03.17.
 */

const { EventEmitter } = require('events');

function compare(template, item) {
  if (template instanceof Function) return template(item);

  return Object.keys(template).every(key => {
    if (template[key] instanceof Function) return template[key](item[key]);
    return template[key] == item[key];
  });
}

module.exports = class Collection extends EventEmitter {
  constructor(name, { itemConstructor, itemIndex }, data) {
    super();
    Object.assign(this, { name, options: { itemConstructor, itemIndex }});

    this.list = new Map();
    data && this.fill(data);
  }

  fill(data) {
    switch (data) {
      case Array.isArray(data):
        data.forEach(item => this.add(item));
        break;
      default:
        Object.keys(data).forEach(index =>
          this.add(index, data[index]));
        break;
    }
    return this;
  }

  add(...args) {
    let index;
    let item;

    const { itemIndex, itemConstructor } = this.options;

    switch(args.length) {
      case 0:
        break;
      case 1:
        [item] = args;
        index = itemIndex ? item[itemIndex] : this.list.size;
        break;
      default:
        [index, item] = args;
        break;
    }

    if (item === undefined || index === undefined) {
      this.emit('error-adding-item', args);
      return false;
    }

    if (this.list.has(index)) {
      this.emit('error-adding-item', args);
      this.emit('adding-item-exists', args);
      return false;
    }

    if (itemConstructor && !(item instanceof itemConstructor)) {
      item = new itemConstructor(item);
    }

    this.list.set(index, item);
    this.emit('added-item', item);
    return true;
  }

  remove(index) {
    const item = this.list.get(index);
    this.list.delete(index) && this.emit('removed-item', index, item);
  }

  getItem(index) {
    return this.list.get(index);
  }

  getItems() {
    return [...this.list].map((index, item) => item);
  }

  findItems(template) {
    return [...this.list].filter((index, item) => compare(template, item));
  }
};
