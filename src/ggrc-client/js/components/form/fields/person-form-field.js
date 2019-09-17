/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../../person/person-data';
import template from './person-form-field.stache';
import loFind from 'lodash/find';
import loFindIndex from 'lodash/findIndex';

export default canComponent.extend({
  tag: 'person-form-field',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      value: {
        set(newValue) {
          if (newValue && newValue.length) {
            this.attr('_value', newValue);
            this.attr('isValueNotEmpty', true);
            return;
          }
          this.attr('_value', []);
          this.attr('isValueNotEmpty', false);
        },
        get() {
          return this.attr('_value');
        },
      },
      fieldId: {
        type: 'number',
      },
    },
    _value: [],
    isValueNotEmpty: false,
    addPerson: function (ev) {
      const {href, id, type} = ev.selectedItem;
      const newPersonMap = new canMap({context_id: null, href, id, type});
      const value = this.attr('_value');
      if (!loFind(value, ({id}) => id === newPersonMap.id)) {
        const newValue = [...value, newPersonMap];
        this.attr('_value', newValue);
        this.valueChanged(newValue);
      }
    },
    removePerson: function (scope, el, ev) {
      ev.preventDefault();
      const value = this.attr('_value');
      const index = loFindIndex(value, ({id}) => id === scope.person.id);
      const firstPart = value.slice(0, index);
      const lastPart = value.slice(index + 1, value.length);
      const newValue = [...firstPart, ...lastPart];
      this.attr('_value', newValue);
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
