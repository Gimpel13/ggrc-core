/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './scroll-top-wrapper.stache';

const viewModel = canDefineMap.extend({
  onTopButtonCssClass: {
    value: 'instantly-hidden',
  },
  prevScrollValue: {
    value: null,
  },
  scrollWrapper: {
    value: () => {},
  },
  onScroll(scope, el, event) {
    const prevScrollValue = this.prevScrollValue;
    const currentTop = event.currentTarget.scrollTop;
    const clientHeight = event.currentTarget.clientHeight;


    if ((currentTop > clientHeight) && (prevScrollValue > currentTop)) {
      this.onTopButtonCssClass = '';
    } else {
      this.onTopButtonCssClass = 'delayed-hidden';
    }

    this.prevScrollValue = currentTop;
  },
  scrollTop() {
    this.scrollWrapper.scrollTop(0);
    this.onTopButtonCssClass = 'instantly-hidden';
  },
});

const events = {
  inserted() {
    this.viewModel.scrollWrapper = $(this.element.find('.scroll-top-wrapper'));
  },
};

export default canComponent.extend({
  tag: 'scroll-top-wrapper',
  view: canStache(template),
  leakScope: true,
  viewModel,
  events,
});
