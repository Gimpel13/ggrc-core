/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import moment from 'moment';
import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import notesTemplate from './release-notes.md';
import template from './release-notes-modal.stache';

const viewModel = canDefineMap.extend({
  shortVersion: {
    type: 'string',
    get() {
      if (!GGRC.config.VERSION) {
        return '';
      }

      return GGRC.config.VERSION.replace(/ \(.*\)/, '');
    },
  },
  releaseNotesDate: {
    type: 'string',
    get() {
      return moment(BUILD_DATE).format('MMM D, YYYY');
    },
  },
  notesTemplate: {
    value: notesTemplate,
  },
  lastVersionNote: {
    type: 'string',
    value: '',
  },
  isVersionListMode: {
    type: 'boolean',
    value: false,
  },
  modalTitle: {
    type: 'string',
    value: 'What\'s new',
  },
  versionList: {
    value: () => [],
  },
  setVersionListMode() {
    this.modalTitle = 'Version History';
    this.isVersionListMode = true;
  },
  setLastVersionMode() {
    this.modalTitle = 'What\'s new';
    this.isVersionListMode = false;
  },
  init() {
    const notesTemplate = this.notesTemplate;
    const headerRegexp = /<h2[^>]*>(.*)<\/h2>/g;
    let result;
    const headerMatches = [];

    while ((result = headerRegexp.exec(notesTemplate)) !== null) {
      headerMatches.push(result);
    }

    const versionList = headerMatches.map((el, index) => {
      const versionDateRegexp = /<em>(.*)<\/em>/;
      const value = el[1];
      const id = `${index}-id`;
      const version = '- ' + value.replace(versionDateRegexp, '');
      let versionDate = versionDateRegexp.exec(value);
      versionDate = versionDate ? versionDate[1] : '';
      return {id, version, versionDate};
    });
    this.versionList = versionList;

    const lastVersionNote = /<\/h2>(.|\n)*?<h2[^>]*>/.exec(notesTemplate)[0]
      .replace(/<\/?h2[^>]*>/g, '');
    this.lastVersionNote = lastVersionNote;
  },
});

export default canComponent.extend({
  tag: 'release-notes-modal',
  view: canStache(template),
  leakScope: true,
  viewModel,
});
