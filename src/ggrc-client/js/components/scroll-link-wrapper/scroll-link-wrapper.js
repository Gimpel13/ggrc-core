/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canComponent from 'can-component';

export default canComponent.extend({
  tag: 'scroll-link-wrapper',
  view: canStache('<content/>'),
  leakScope: true,
  events: {
    'a click'(el, event) {
      const id = el.attr('href');
      const linkedHeader = this.element.find(id)[0];

      if (linkedHeader) {
        event.preventDefault();

        linkedHeader.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    },
  },
});
