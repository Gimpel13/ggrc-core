/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Component from '../unmap-dropdown-item';
import Mappings from '../../../models/mappers/mappings';
import * as SnapshotUtils from '../../../plugins/utils/snapshot-utils';
import * as CurrentPageUtils from '../../../plugins/utils/current-page-utils';

describe('unmap-dropdown-item component', function () {
  describe('viewModel scope', function () {
    let viewModel;

    beforeEach(function () {
      viewModel = getComponentVM(Component);
    });

    describe('issueUnmap get() method', function () {
      it('returns true if page_instance.type equals to "Issue" string',
        function () {
          viewModel.attr('page_instance.type', 'Issue');
          expect(viewModel.attr('issueUnmap')).toBe(true);
        });

      it('returns true if instance.type equals to "Issue" string', function () {
        viewModel.attr('instance.type', 'Issue');
        expect(viewModel.attr('issueUnmap')).toBe(true);
      });

      it('returns false if there are no instance.type and page_instance.type',
        function () {
          viewModel.attr('page_instance.type', null);
          viewModel.attr('instance.type', null);
          expect(viewModel.attr('issueUnmap')).toBe(false);
        });
    });

    describe('denyIssueUnmap get() method', function () {
      it('returns true if page_instance.type equals to "Audit" and' +
      'instance.allow_unmap_from_audit is false', function () {
        viewModel.attr('page_instance.type', 'Audit');
        viewModel.attr('instance.allow_unmap_from_audit', false);
        expect(viewModel.attr('denyIssueUnmap')).toBe(true);
      });

      it('returns true if instance.type equals to "Audit" and ' +
      'page_instance.allow_unmap_from_audit is false', function () {
        viewModel.attr('instance.type', 'Audit');
        viewModel.attr('page_instance.allow_unmap_from_audit', false);
        expect(viewModel.attr('denyIssueUnmap')).toBe(true);
      });

      it('returns false if instance.allow_unmap_from_audit and ' +
      'page_instance.allow_unmap_from_audit are both true', function () {
        viewModel.attr('instance.allow_unmap_from_audit', true);
        viewModel.attr('page_instance.allow_unmap_from_audit', true);
        expect(viewModel.attr('denyIssueUnmap')).toBe(false);
      });

      it('returns false if instnace.type and page_instnace.type do not equal' +
      'to "Audit"', function () {
        viewModel.attr('instance.type', 'Type');
        viewModel.attr('page_instance', 'Type');
        expect(viewModel.attr('denyIssueUnmap')).toBe(false);
      });
    });

    describe('isAllowedToUnmap get() method', () => {
      beforeEach(() => {
        spyOn(Mappings, 'allowedToUnmap');
        spyOn(SnapshotUtils, 'isAuditScopeModel');
        spyOn(SnapshotUtils, 'isSnapshotParent');
        spyOn(CurrentPageUtils, 'isAllObjects');
        spyOn(CurrentPageUtils, 'isMyWork');

        viewModel.attr('instance', {type: 'any type'});
        viewModel.attr('options', {});
      });

      it('returns false if unmapping is not allowed', () => {
        Mappings.allowedToUnmap.and.returnValue(false);

        SnapshotUtils.isAuditScopeModel.and.returnValue(false);
        SnapshotUtils.isSnapshotParent.and.returnValue(false);
        CurrentPageUtils.isAllObjects.and.returnValue(false);
        CurrentPageUtils.isMyWork.and.returnValue(false);
        viewModel.attr('options.isDirectlyRelated', true);

        expect(viewModel.attr('isAllowedToUnmap')).toBe(false);
        expect(Mappings.allowedToUnmap).toHaveBeenCalled();
      });

      it('returns false when user is on "My Work" page', () => {
        Mappings.allowedToUnmap.and.returnValue(true);

        SnapshotUtils.isAuditScopeModel.and.returnValue(false);
        SnapshotUtils.isSnapshotParent.and.returnValue(false);
        CurrentPageUtils.isAllObjects.and.returnValue(false);
        CurrentPageUtils.isMyWork.and.returnValue(true);
        viewModel.attr('options.isDirectlyRelated', true);

        expect(viewModel.attr('isAllowedToUnmap')).toBe(false);
      });

      it('returns false when user is on "All Objects" page', () => {
        Mappings.allowedToUnmap.and.returnValue(true);

        SnapshotUtils.isAuditScopeModel.and.returnValue(false);
        SnapshotUtils.isSnapshotParent.and.returnValue(false);
        CurrentPageUtils.isAllObjects.and.returnValue(true);
        CurrentPageUtils.isMyWork.and.returnValue(false);
        viewModel.attr('options.isDirectlyRelated', true);

        expect(viewModel.attr('isAllowedToUnmap')).toBe(false);
      });

      it('returns false when instance is not directly related to ' +
        'parent instance', () => {
        Mappings.allowedToUnmap.and.returnValue(true);

        SnapshotUtils.isAuditScopeModel.and.returnValue(false);
        SnapshotUtils.isSnapshotParent.and.returnValue(false);
        CurrentPageUtils.isAllObjects.and.returnValue(false);
        CurrentPageUtils.isMyWork.and.returnValue(false);

        viewModel.attr('options.isDirectlyRelated', false);

        expect(viewModel.attr('isAllowedToUnmap')).toBe(false);
      });

      it('returns false when instance is in Audit scope', () => {
        Mappings.allowedToUnmap.and.returnValue(true);

        SnapshotUtils.isAuditScopeModel.and.returnValue(true);
        SnapshotUtils.isSnapshotParent.and.returnValue(false);
        CurrentPageUtils.isAllObjects.and.returnValue(false);
        CurrentPageUtils.isMyWork.and.returnValue(false);

        viewModel.attr('options.isDirectlyRelated', false);

        expect(viewModel.attr('isAllowedToUnmap')).toBe(false);
      });

      it('returns false when instance is snapshot parent', () => {
        Mappings.allowedToUnmap.and.returnValue(true);

        SnapshotUtils.isAuditScopeModel.and.returnValue(false);
        SnapshotUtils.isSnapshotParent.and.returnValue(true);
        CurrentPageUtils.isAllObjects.and.returnValue(false);
        CurrentPageUtils.isMyWork.and.returnValue(false);

        viewModel.attr('options.isDirectlyRelated', false);

        expect(viewModel.attr('isAllowedToUnmap')).toBe(false);
      });
    });
  });
});
