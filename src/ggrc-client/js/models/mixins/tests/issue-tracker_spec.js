/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as issueTrackerUtils from '../../../plugins/utils/issue-tracker-utils';
import {makeFakeInstance} from '../../../../js_specs/spec_helpers';
import Cacheable from '../../cacheable';
import IssueTracker from '../issue-tracker';

describe('IssueTracker mixin', () => {
  let Mixin;
  const START_ENABLED_VALUE = GGRC.ISSUE_TRACKER_ENABLED;

  beforeAll(() => {
    GGRC.ISSUE_TRACKER_ENABLED = true;
    Mixin = IssueTracker;
  });

  afterAll(() => {
    GGRC.ISSUE_TRACKER_ENABLED = START_ENABLED_VALUE;
  });

  describe('"getConfig" method', () => {
    let method;
    let stub;
    let issueTrackerConfig;

    beforeEach(() => {
      issueTrackerConfig = {
        hotlist_id: '766459',
        enabled: true,
      };
      stub = makeFakeInstance({
        model: Cacheable,
        staticProps: {
          buildIssueTrackerConfig() {
            return issueTrackerConfig;
          },
        },
      })();
      method = Mixin.prototype.getConfig;
    });

    it('should return object', () => {
      const config = method.call(stub);
      const isObject = config instanceof Object;
      expect(isObject).toBe(true);
    });

    it('returned object should have "issueTrackerConfig" property', () => {
      const config = method.call(stub);
      const isConfigPropertyExist = config.issueTrackerConfig !== undefined;
      expect(isConfigPropertyExist).toBe(true);
    });

    it('returned object should have "canUseIssueTracker" property', () => {
      const config = method.call(stub);
      const isCanUseITrPropertyExist = config.issueTrackerConfig !== undefined;
      expect(isCanUseITrPropertyExist).toBe(true);
    });

    it('should show issue tracker if globally enabled and' +
    ' turn off by default', () => {
      GGRC.ISSUE_TRACKER_ENABLED = true;
      const stub = makeFakeInstance({
        model: Cacheable,
      })();
      const {issueTrackerConfig: {enabled}} = method.call(stub);
      expect(enabled).toBe(false);
    });

    it('should show issue tracker if globally enabled and' +
    ' set up default values', () => {
      GGRC.ISSUE_TRACKER_ENABLED = true;
      const {issueTrackerConfig: {enabled}} = method.call(stub);
      expect(enabled).toBe(true);
    });

    it('should hide issue tracker if globally disabled and' +
       ' turn off by default', () => {
      GGRC.ISSUE_TRACKER_ENABLED = false;
      const {issueTrackerConfig: {enabled}} = method.call(stub);
      expect(enabled).toBe(true);

      expect(stub.attr('issue_tracker.enabled')).toBeFalsy();
    });
  });

  describe('initIssueTracker() method', () => {
    let method;
    let stub;
    let config;
    let issueTrackerConfig;

    beforeAll(() => {
      GGRC.ISSUE_TRACKER_ENABLED = true;
      method = Mixin.prototype.initIssueTracker;
      issueTrackerConfig = {};
      stub = makeFakeInstance({
        model: Cacheable,
      })();
      config = {
        issueTrackerConfig,
        canUseIssueTracker: true,
      };
    });

    it('should call "issueTrackerUtils.initIssueTrackerObject"', () => {
      spyOn(issueTrackerUtils, 'initIssueTrackerObject');
      method.call(stub, config);
      const calls = issueTrackerUtils.initIssueTrackerObject.calls;
      const callArgs = calls.mostRecent().args;

      expect(calls.count()).toEqual(1);
      expect(callArgs[1]).toEqual(issueTrackerConfig);
      expect(callArgs[2]).toBe(true);
    });
  });

  describe('setDefaultHotlistAndComponent() method', () => {
    let method;
    let stub;

    beforeAll(() => {
      GGRC.ISSUE_TRACKER_ENABLED = true;
      method = Mixin.prototype.setDefaultHotlistAndComponent;
    });

    beforeEach(() => {
      stub = makeFakeInstance({
        model: Cacheable,
        staticProps: {
          buildIssueTrackerConfig() {
            return {
              hotlist_id: 'hotlist_id',
              component_id: 'component_id',
            };
          },
        },
        instanceProps: {
          issue_tracker: {},
          getConfig() {
            return Mixin.prototype.getConfig.call(this);
          },
        },
      })();
    });

    it('should set up default hotlist and component ids', () => {
      method.apply(stub);

      expect(stub.issue_tracker.hotlist_id).toBe('hotlist_id');
      expect(stub.issue_tracker.component_id).toBe('component_id');
    });
  });
});
