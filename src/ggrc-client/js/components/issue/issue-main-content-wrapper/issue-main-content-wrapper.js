/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canComponent from 'can-component';
import canMap from 'can-map';
import {isAllowedFor} from '../../../permission';
import {getModelByType} from '../../../plugins/utils/models-utils';
import {getCurrentUser} from '../../../plugins/utils/user-utils';

export default canComponent.extend({
  tag: 'issue-main-content-wrapper',
  viewModel: canMap.extend({
    define: {
      readonlyFields: {
        get() {
          const instance = this.instance;
          const isCurrentUserAdmin =
            ['Superuser', 'Administrator']
              .indexOf(getCurrentUser().system_wide_role) !== -1;
          const fieldsList = getModelByType('Issue')
            .tree_view_options
            .attr_list
            .map((attr) => attr.attr_name);
          const isAllowedForUpdate =
            instance.isNew() || isAllowedFor('update', instance);
          const alwaysReadOnlyFields =
            isCurrentUserAdmin ?
              [] :
              instance.immutable_update_attributes;
          const readonlyFields = {};
          fieldsList.forEach((field) => {
            readonlyFields[field] =
              !isAllowedForUpdate ||
              alwaysReadOnlyFields.indexOf(field) !== -1;
          });
          readonlyFields.roles =
            isCurrentUserAdmin ?
              [] :
              instance
                .immutable_update_acl_attributes
                .map(({name}) => name);
          readonlyFields.issue_tracker = !isAllowedForUpdate;

          return readonlyFields;
        },
      },
      disableIssueTrackerDependentFields: {
        get() {
          return this.attr('isIssueLinked') &&
            this.attr('issueTrackerState') !== 'generateNew';
        },
      },
    },
    instance: {},
    isIssueLinked: false,
    issueTrackerState: '',
    updateIssueTrackerState({state}) {
      this.attr('issueTrackerState', state);
    },
  }),
});
