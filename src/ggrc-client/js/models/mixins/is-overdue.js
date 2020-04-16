/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import moment from 'moment';
import Mixin from './mixin';
import loFind from 'lodash/find';

/**
 * Specific Model mixin to check overdue status
 */
export default class IsOverdue extends Mixin {
  'after:init'() {
    this.attr('isOverdue', this._isOverdue());
    this.bind('change', (event, fieldName) => {
      if (this.overdueOption.attr('endDateFields').indexOf(fieldName) !== -1) {
        this.attr('isOverdue', this._isOverdue());
      }
    });
  }
  _isOverdue() {
    const endDateField = loFind(this.attr('overdueOption.endDateFields'),
      (field) => !!this.attr(field));
    const endDate = moment(this.attr(endDateField));
    const today = moment().startOf('day');
    const startOfDate = moment(endDate).startOf('day');

    if (this.attr('status') === this.attr('overdueOption.doneState')) {
      return false;
    }

    return endDate && today.diff(startOfDate, 'days') > 0;
  }
}
