/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Mixin from './mixin';

export default class Verifiable extends Mixin {
  'after:init'() {
    if (this.attr('is_verification_needed')) {
      this.attr('overdueOption.doneState', 'Verified');
    }
  }
}
