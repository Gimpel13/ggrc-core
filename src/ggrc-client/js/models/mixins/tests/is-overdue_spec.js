/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import moment from 'moment';
import canMap from 'can-map';
import IsOverdue from '../is-overdue';

describe('IsOverdue mixin', function () {
  let Mixin;

  beforeAll(function () {
    Mixin = IsOverdue;
  });

  describe('_isOverdue() method: ', function () {
    let instance;
    let method;

    beforeEach(function () {
      instance = new canMap({
        next_due_date: '2030-01-01',
        status: 'Not Started',
        overdueOption: {
          endDateFields: ['start_date'],
          doneState: 'Finished',
        },
      });
      method = Mixin.prototype._isOverdue;
    });

    it('is defined', function () {
      expect(method).toBeDefined();
    });

    it('returns false, if status is "Verified" ', function () {
      instance.overdueOption.attr('doneState', 'Verified');
      instance.attr('next_due_date', moment().subtract(1, 'd'));
      instance.attr('status', 'Verified');

      expect(method.apply(instance)).toEqual(false);
    });

    it('returns false, if status is not "Verified"' +
      ' and Next Due Date or End Date is later than today', function () {
      expect(method.apply(instance)).toEqual(false);
    });

    it('returns true, if status is not "Verified"' +
      ' and Next Due Date or' +
      ' End Date has already passed today\'s date', function () {
      instance.overdueOption.attr('endDateFields', ['next_due_date']);
      instance.attr('next_due_date', '2015-01-01');
      expect(method.apply(instance)).toEqual(true);
    });

    it('returns true, if next_due_date is earlier than today', function () {
      instance.overdueOption.attr('endDateFields', ['next_due_date']);
      instance.attr('next_due_date', moment().subtract(1, 'd'));

      const result = method.apply(instance);

      expect(result).toEqual(true);
    });

    it('returns false, if next_due_date is today', function () {
      instance.overdueOption.attr('endDateFields', ['next_due_date']);
      instance.attr('next_due_date', moment());

      const result = method.apply(instance);

      expect(result).toEqual(false);
    });

    it(`returns true, if end_date is empty
    and next_due_date is earlier than today`, function () {
      instance.overdueOption
        .attr('endDateFields', ['end_date', 'next_due_date']);
      instance.attr('next_due_date', moment().subtract(1, 'd'));

      const result = method.apply(instance);

      expect(result).toEqual(true);
    });
  });
});
