/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import template from './multiselect-form-field.stache';

export default can.Component.extend({
  tag: 'multiselect-form-field',
  template: can.stache(template),
  leakScope: false,
  viewModel: can.Map.extend({
    define: {
      inputValue: {
        set(newValue) {
          this.attr('_value', newValue);
          this.valueChanged(newValue);
        },
        get() {
          return this.attr('_value');
        },
      },
      value: {
        set(newValue) {
          this.attr('_value', newValue);
        },
        get() {
          return this.attr('_value');
        },
      },
    },
    _value: false,
    fieldId: null,
    options: [],
    valueChanged(newValue) {
      this.dispatch({
        type: 'valueChanged',
        fieldId: this.fieldId,
        value: newValue,
      });
    },
  }),
});
