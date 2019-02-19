/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import '../questionnaire-mapping-link/questionnaire-mapping-link';
import '../issue/issue-unmap-item';
import template from './unmap-dropdown-item.stache';
import Mappings from '../../models/mappers/mappings';
import {
  isAllObjects,
  isMyWork,
} from '../../plugins/utils/current-page-utils';

export default can.Component.extend({
  tag: 'unmap-dropdown-item',
  template,
  leakScope: false,
  viewModel: {
    define: {
      issueUnmap: {
        get: function () {
          return this.attr('page_instance.type') === 'Issue' ||
            this.attr('instance.type') === 'Issue';
        },
      },
      denyIssueUnmap: {
        get: function () {
          return !Mappings.allowedToUnmap(this.attr('page_instance'),
            this.attr('instance'))
            && ((this.attr('page_instance.type') === 'Audit'
                && !this.attr('instance.allow_unmap_from_audit'))
              || (this.attr('instance.type') === 'Audit'
                && !this.attr('page_instance.allow_unmap_from_audit')));
        },
      },
      isAllowedToUnmap: {
        get() {
          let pageInstance = this.attr('page_instance');
          let instance = this.attr('instance');
          let options = this.attr('options');

          return Mappings.allowedToUnmap(pageInstance, instance)
            && !(isAllObjects() || isMyWork())
            && options.attr('isDirectlyRelated');
        },
      },
      isMappableExternally: {
        get() {
          let source = this.attr('page_instance.type');
          let destination = this.attr('instance.type');

          return Mappings.shouldBeMappedExternally(source, destination);
        },
      },
    },
    instance: {},
    page_instance: {},
    options: {},
  },
});
