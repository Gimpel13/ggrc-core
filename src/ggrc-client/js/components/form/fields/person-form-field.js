/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../../person/person-data';
import template from './person-form-field.stache';
import loEvery from 'lodash/every';
import loFilter from 'lodash/filter';

export default canComponent.extend({
  tag: 'person-form-field',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      value: {
        set(newValue) {
          return newValue || [];
        },
      },
      isNotEmpty: {
        get() {
          const value = this.attr('value');
          return value && value.length;
        },
      },
      fieldId: {
        type: 'number',
      },
    },
    addPerson: function ({selectedItem: {href, id, type}}) {
      const value = this.attr('value');
      const isNewPerson = loEvery(value, (el) => el.id !== id);

      if (!isNewPerson) {
        return;
      }

      const newPerson = new canMap({context_id: null, href, id, type});
      value.push(newPerson);
      this.valueChanged(value);
    },
    removePerson: function ({person}, el, ev) {
      ev.preventDefault();
      const value = this.attr('value');
      const newValue = loFilter(value, ({id}) => id !== person.id);
      this.attr('value', newValue);
      this.valueChanged(newValue);
    },
    valueChanged: function (newValue) {
      this.dispatch({
        type: 'valueChanged',
        fieldId: this.attr('fieldId'),
        value: newValue,
      });
    },
  }),
});
