/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import {makeFakeInstance} from '../../../../js_specs/spec_helpers';
import * as currentPageUtils from '../../../plugins/utils/current-page-utils';
import AssessmentIssueTracker from '../assessment-issue-tracker';
import IssueTracker from '../issue-tracker';
import Assessment from '../../business-models/assessment';

describe('AssessmentIssueTracker mixin', () => {
  let Mixin;
  let audit;
  const START_ENABLED_VALUE = GGRC.ISSUE_TRACKER_ENABLED;

  beforeAll(() => {
    GGRC.ISSUE_TRACKER_ENABLED = true;
    Mixin = AssessmentIssueTracker;

    audit = new canMap({
      id: 123,
      title: 'Audit',
      type: 'Audit',
      issue_tracker: {
        hotlist_id: 'hotlist_id',
        component_id: 'component_id',
      },
    });
  });

  afterAll(() => {
    GGRC.ISSUE_TRACKER_ENABLED = START_ENABLED_VALUE;
  });

  describe('"getConfig" method', () => {
    let method;
    let fakeAudit;
    let fakeAssessment;

    beforeEach(function () {
      fakeAudit = new canMap({
        id: 1,
        type: 'Audit',
        issue_tracker: {
          enabled: true,
        },
      });
      fakeAssessment = new canMap({
        audit: fakeAudit,
        issue_tracker: {
          enabled: null,
        },
        isNew() {
          return !this.id;
        },
        getParentAudit() {
          return fakeAudit;
        },
      });

      method = Mixin.prototype.getConfig;
    });

    it('should return object', () => {
      const config = method.call(fakeAssessment);
      const isObject = config instanceof Object;

      expect(isObject).toBe(true);
    });

    it('returned object should have "issueTrackerConfig" property', () => {
      const config = method.call(fakeAssessment);
      const isConfigPropertyExist = config.issueTrackerConfig !== undefined;

      expect(isConfigPropertyExist).toBe(true);
    });

    it('returned object should have "canUseIssueTracker" property', () => {
      const config = method.call(fakeAssessment);
      const isCanUseITrPropertyExist = config.issueTrackerConfig !== undefined;

      expect(isCanUseITrPropertyExist).toBe(true);
    });

    it('should show ITR if enabled in audit',
      () => {
        fakeAssessment.attr('audit.issue_tracker.enabled', true);

        const {canUseIssueTracker} = method.call(fakeAssessment);

        expect(canUseIssueTracker).toBe(true); // show issue tracker controls
      });

    it('should hide ITR if disabled in audit',
      () => {
        fakeAssessment.attr('audit.issue_tracker.enabled', false);

        const {canUseIssueTracker} = method.call(fakeAssessment);

        expect(canUseIssueTracker).toBe(false); // show issue tracker controls
      });

    it('should hide ITR if disabled in audit and enabled on instance',
      () => {
        fakeAssessment.attr('issue_tracker.enabled', true);
        fakeAssessment.attr('audit.issue_tracker.enabled', false);

        const {canUseIssueTracker} = method.call(fakeAssessment);

        expect(canUseIssueTracker).toBe(false);
      }
    );

    it('should hide ITR if disabled on instance and in audit', () => {
      fakeAssessment.attr('issue_tracker.enabled', false);
      fakeAssessment.attr('audit.issue_tracker.enabled', false);

      const {canUseIssueTracker} = method.call(fakeAssessment);

      expect(canUseIssueTracker).toBe(false);
    });

    it('should show ITR if enabled on instance and in audit', () => {
      fakeAssessment.attr('issue_tracker.enabled', true);
      fakeAssessment.attr('audit.issue_tracker.enabled', true);

      const {canUseIssueTracker} = method.call(fakeAssessment);

      expect(canUseIssueTracker).toBe(true);
    });

    it('should show ITR if disabled on instance and enabled in audit',
      () => {
        fakeAssessment.attr('issue_tracker.enabled', false);
        fakeAssessment.attr('audit.issue_tracker.enabled', true);

        const {canUseIssueTracker} = method.call(fakeAssessment);

        expect(canUseIssueTracker).toBe(true);
      }
    );

    it('should enable ITR if enabled in audit', () => {
      fakeAssessment.attr('audit.issue_tracker.enabled', true);

      const {issueTrackerConfig} = method.call(fakeAssessment);

      expect(issueTrackerConfig.enabled).toBe(true); // turn on by default for assessment
    });

    it('should disable ITR if disable in audit', () => {
      fakeAssessment.attr('audit.issue_tracker.enabled', false);

      const {issueTrackerConfig} = method.call(fakeAssessment);

      expect(issueTrackerConfig.enabled).toBe(false); // turn on by default for assessment
    });
  });

  describe('"after:init" event', () => {
    const asmtProto = Assessment.prototype;

    beforeAll(() => {
      spyOn(asmtProto, 'getParentAudit').and.returnValue(audit);
    });

    it('should call "initIssueTracker" for audit', () => {
      spyOn(asmtProto, 'initIssueTracker');
      makeFakeInstance({model: Assessment})({type: 'Assessment'});

      expect(asmtProto.initIssueTracker).toHaveBeenCalled();
    });

    it('should call "trackAuditUpdates" method', () => {
      spyOn(asmtProto, 'trackAuditUpdates');
      makeFakeInstance({model: Assessment})({type: 'Assessment'});

      expect(asmtProto.trackAuditUpdates).toHaveBeenCalled();
    });
  });

  describe('getParentAudit() method: ', function () {
    let method;
    let assessment;

    beforeEach(function () {
      assessment = new canMap({
        audit,
      });
      method = Mixin.prototype.getParentAudit;
    });

    it('should resolve to assigned audit property', function () {
      const resolvedAudit = method.call(assessment);

      expect(resolvedAudit).toEqual(audit);
    });

    it('should resolve to audit from page instance', function () {
      spyOn(currentPageUtils, 'getPageInstance')
        .and.returnValue(audit);

      assessment.isNew = () => true;
      assessment.attr('audit', null);

      const resolvedAudit = method.apply(assessment);

      expect(resolvedAudit).toEqual(audit);
    });
  });

  describe('initIssueTracker() method [new assessment]', () => {
    let method;
    let fakeAssessment;
    let fakeAudit;
    let IssueTrackerProto;
    let config;

    beforeAll(() => {
      method = Mixin.prototype.initIssueTracker;
      IssueTrackerProto = IssueTracker.prototype;
    });

    beforeEach(() => {
      fakeAudit = new canMap({
        id: 1,
        type: 'Audit',
        issue_tracker: {
          enabled: true,
        },
      });

      fakeAssessment = new canMap({
        audit: fakeAudit,
        issue_tracker: {
          enabled: null,
        },
        getParentAudit() {
          return fakeAudit;
        },
      });

      config = {
        issueTrackerConfig: {},
        canUseIssueTracker: true,
      };

      spyOn(IssueTrackerProto, 'initIssueTracker');
    });

    it('should call "initIssueTracker" of "IssueTracker" if' +
      'issue tracker globally enabled', () => {
      GGRC.ISSUE_TRACKER_ENABLED = true;
      method.call(fakeAssessment, config);

      expect(IssueTrackerProto.initIssueTracker.calls.count()).toBe(1);
    });

    it('should not call "initIssueTracker" of "IssueTracker" if' +
      'issue tracker globally disenabled', () => {
      GGRC.ISSUE_TRACKER_ENABLED = false;
      method.call(fakeAssessment, config);

      expect(IssueTrackerProto.initIssueTracker.calls.count()).toBe(0);
    });

    it('should call "getParentAudit" method if' +
    'issue tracker globally enabled', () => {
      spyOn(fakeAssessment, 'getParentAudit');
      GGRC.ISSUE_TRACKER_ENABLED = true;
      method.call(fakeAssessment, config);

      expect(fakeAssessment.getParentAudit.calls.count()).toBe(1);
    });

    it('should not call "getParentMethod" if' +
      'issue tracker globally disenabled', () => {
      GGRC.ISSUE_TRACKER_ENABLED = false;
      method.call(fakeAssessment, config);

      expect(IssueTrackerProto.initIssueTracker.calls.count()).toBe(0);
    });
  });

  describe('setDefaultHotlistAndComponent() method', () => {
    let method;
    let stub;
    let IssueTrackerProto;

    beforeAll(() => {
      GGRC.ISSUE_TRACKER_ENABLED = true;
      method = Assessment.prototype.setDefaultHotlistAndComponent;
      spyOn(Assessment.prototype, 'getParentAudit').and.returnValue(audit);
      stub = makeFakeInstance({model: Assessment})();
      IssueTrackerProto = IssueTracker.prototype;
    });

    it('should call "setDefaultHotlistAndComponent" method' +
      'of "IssueTracker"', () => {
      spyOn(IssueTrackerProto, 'setDefaultHotlistAndComponent');
      method.call(stub);

      expect(IssueTrackerProto.setDefaultHotlistAndComponent.calls.count())
        .toBe(1);
    });

    it('should set up default hotlist and component ids', () => {
      stub.attr('issue_tracker').attr({
        hotlist_id: null,
        component_id: null,
      });

      method.call(stub);

      expect(stub.issue_tracker.hotlist_id).toBe('hotlist_id');
      expect(stub.issue_tracker.component_id).toBe('component_id');
    });
  });
});
