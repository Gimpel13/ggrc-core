/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import canComponent from 'can-component';
import {
  toObject,
  extendSnapshot,
} from '../../plugins/utils/snapshot-utils';

export default canComponent.extend({
  tag: 'assessment-modal',
  leakScope: true,
  viewModel: canMap.extend({
    instance: null,
    isNewInstance: false,
    mappedObjects: [],
    loadData() {
      return this.attr('instance').getRelatedObjects()
        .then((data) => {
          let snapshots = data.Snapshot.map((snapshot) => {
            let snapshotObject = toObject(snapshot);
            return extendSnapshot(snapshot, snapshotObject);
          });

          this.attr('mappedObjects', snapshots);
        });
    },
  }),
  events: {
    inserted() {
      let vm = this.viewModel;
      if (!vm.attr('isNewInstance')) {
        vm.loadData();
      }
    },
  },
});
