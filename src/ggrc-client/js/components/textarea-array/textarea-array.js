/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanComponent from 'can-component';
export default CanComponent.extend({
  tag: 'textarea-array',
  view: can.stache(
    '<textarea class="{{className}}" placeholder="{{placeholder}}">' +
    '{{content}}' +
    '</textarea>'
  ),
  leakScope: true,
  viewModel: can.Map.extend({
    array: null,
    className: '',
    delimeter: ', ',
    placeholder: '',
    init: function () {
      this.updateContent();
    },
    updateContent: function () {
      let array = this.attr('array') || [];
      this.attr('content', array.join(this.attr('delimeter')));
    },
  }),
  events: {
    'textarea change': function (el, ev) {
      let val = $(el).val();
      this.viewModel.attr('array',
        $.map(val.split(','), $.proxy(''.trim.call, ''.trim)));
      this.viewModel.updateContent();
    },
  },
});
