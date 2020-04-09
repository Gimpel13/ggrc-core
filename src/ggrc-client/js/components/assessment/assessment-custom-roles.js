/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canComponent from 'can-component';
import '../related-objects/related-people-access-control';
import '../related-objects/related-people-access-control-group';
import '../people/editable-people-group';
import template from './templates/assessment-custom-roles.stache';
import viewModel from '../custom-roles/custom-roles-vm';
import {notifierXHR} from '../../plugins/utils/notifiers-utils';

export default canComponent.extend({
  tag: 'assessment-custom-roles',
  view: canStache(template),
  leakScope: true,
  viewModel: viewModel.extend({
    deferredSave: null,
    onStateChangeDfd: null,
    setInProgress: $.noop(),
    save(args) {
      this.attr('deferredSave').push(() => {
        this.attr('updatableGroupId', args.groupId);
      })
        .then(() => {
          this.filterACL();
        })
        .catch((instance, xhr) => {
          if (xhr.status === 409) {
            notifierXHR('warning', xhr);
            return;
          }
          notifierXHR('error', xhr);
        })
        .always(() => {
          this.attr('updatableGroupId', null);
        });
    },
  }),
});
