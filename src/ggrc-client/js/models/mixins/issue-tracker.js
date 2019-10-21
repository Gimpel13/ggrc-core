/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import Mixin from './mixin';
import * as issueTrackerUtils from '../../plugins/utils/issue-tracker-utils';

export default class IssueTracker extends Mixin {
  'after:init'() {
    this.initIssueTracker(this.getConfig());
  }

  'before:refresh'() {
    issueTrackerUtils.cleanUpWarnings(this);
  }

  beforeEnqueue() {
    issueTrackerUtils.cleanUpBeforeSave(this);
  }

  afterSave() {
    issueTrackerUtils.checkWarnings(this);
  }

  initIssueTracker({config, canUseIssueTracker}) {
    if (!GGRC.ISSUE_TRACKER_ENABLED) {
      return;
    }

    if (!this.issue_tracker) {
      this.attr('issue_tracker', new canMap({}));
    }

    issueTrackerUtils.initIssueTrackerObject(
      this,
      config,
      canUseIssueTracker,
    );
  }

  getConfig() {
    const config = this.constructor.buildIssueTrackerConfig
      ? this.constructor.buildIssueTrackerConfig(this)
      : {enabled: false};
    config.enabled = this.isNew();
    return {config, canUseIssueTracker: true};
  }

  setDefaultHotlistAndComponent() { // eslint-disable-line id-length
    const {config} = this.getConfig();
    this.attr('issue_tracker').attr({
      hotlist_id: config.hotlist_id,
      component_id: config.component_id,
    });
  }

  issueCreated() {
    return GGRC.ISSUE_TRACKER_ENABLED
      && issueTrackerUtils.isIssueCreated(this);
  }

  issueTrackerEnabled() {
    return GGRC.ISSUE_TRACKER_ENABLED
      && issueTrackerUtils.isIssueTrackerEnabled(this);
  }
}

Object.assign(
  IssueTracker,
  issueTrackerUtils.issueTrackerStaticFields
);
