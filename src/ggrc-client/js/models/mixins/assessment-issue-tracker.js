/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import IssueTracker from './issue-tracker';
import * as issueTrackerUtils from '../../plugins/utils/issue-tracker-utils';
import {getPageInstance} from '../../plugins/utils/current-page-utils';
import {reify} from '../../plugins/utils/reify-utils';

export default class AssessmentIssueTracker extends IssueTracker {
  'after:init'() {
    const audit = this.getParentAudit();
    this.attr('audit', audit);
    this.initIssueTracker(this.getConfig());
    this.trackAuditUpdates();
  }

  'before:refresh'() {
    super['before:refresh']();
  }

  initIssueTracker({config, canUseIssueTracker}) {
    super.initIssueTracker({config, canUseIssueTracker});
  }

  beforeEnqueue() {
    super.beforeEnqueue();
  }

  afterSave() {
    super.afterSave();
  }

  setDefaultHotlistAndComponent() { // eslint-disable-line id-length
    super.setDefaultHotlistAndComponent();
  }

  trackAuditUpdates() {
    const audit = this.attr('audit') && reify(this.attr('audit'));

    if (!audit) {
      return;
    }

    audit.bind('updated', (event) => {
      this.attr('audit', event.target);
      this.initIssueTracker(this.getConfig());
    });
  }

  getParentAudit() {
    if (this.audit) {
      return this.audit;
    }

    if (this.isNew()) {
      const pageInstance = getPageInstance();
      if (pageInstance.type !== 'Audit') {
        throw new Error('Assessment must be created from Audit page only');
      }

      return pageInstance;
    }
  }

  getConfig() {
    const auditIssueTracker = this.attr('audit.issue_tracker') || {};
    const canUseIssueTracker = auditIssueTracker.enabled;
    const issueTrackerEnabled = this.isNew() && canUseIssueTracker;
    // turned ON for Assessment & Assessment Template by default
    // for newly created instances
    // for existing instance, the value from the server will be used

    const issueTitle = this.title || '';
    const config = new canMap(auditIssueTracker).attr({
      title: issueTitle,
      enabled: issueTrackerEnabled,
    });
    return {config, canUseIssueTracker};
  }

  issueCreated() {
    return this.attr('can_use_issue_tracker')
      && issueTrackerUtils.isIssueCreated(this);
  }

  issueTrackerEnabled() {
    return issueTrackerUtils.isIssueTrackerEnabled(this);
  }
}

Object.assign(
  AssessmentIssueTracker,
  issueTrackerUtils.issueTrackerStaticFields
);
