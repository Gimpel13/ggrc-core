/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canList from 'can-list';
import canMap from 'can-map';
import {
  buildChangeDescriptor,
  simpleFieldResolver,
  customAttributeResolver,
  resolveAttributeObjects,
} from '../conflict-resolvers';

describe('conflict resolvers', () => {
  describe('buildChangeDescriptor method', () => {
    describe('builds "hasConflict"', () => {
      it('positive if value was changed locally and on server differently',
        () => {
          const previousValue = '1';
          const currentValue = '2';
          const remoteValue = '3';

          const {hasConflict} = buildChangeDescriptor(
            previousValue,
            currentValue,
            remoteValue);

          expect(hasConflict).toBe(true);
        });

      it('negative if value was changed only on server', () => {
        const previousValue = '1';
        const currentValue = '1';
        const remoteValue = '2';

        const {hasConflict} = buildChangeDescriptor(
          previousValue,
          currentValue,
          remoteValue);

        expect(hasConflict).toBe(false);
      });

      it('negative if value was changed only locally', () => {
        const previousValue = '1';
        const currentValue = '2';
        const remoteValue = '1';

        const {hasConflict} = buildChangeDescriptor(
          previousValue,
          currentValue,
          remoteValue);

        expect(hasConflict).toBe(false);
      });

      it('negative if value was changed locally and on server equally',
        () => {
          const previousValue = '1';
          const currentValue = '2';
          const remoteValue = '2';

          const {hasConflict} = buildChangeDescriptor(
            previousValue,
            currentValue,
            remoteValue);

          expect(hasConflict).toBe(false);
        });
    });

    describe('builds "isChangedLocally"', () => {
      it('positive if value was changed locally', () => {
        const previousValue = '1';
        const currentValue = '2';

        const {isChangedLocally} = buildChangeDescriptor(
          previousValue,
          currentValue);

        expect(isChangedLocally).toBe(true);
      });

      it('negative if value was not changed locally', () => {
        const previousValue = '1';
        const currentValue = '1';

        const {isChangedLocally} = buildChangeDescriptor(
          previousValue,
          currentValue);

        expect(isChangedLocally).toBe(false);
      });
    });
  });

  describe('simpleFieldResolver', () => {
    let baseAttrs;
    let attrs;
    let remoteAttrs;
    let container;

    beforeEach(() => {
      baseAttrs = {};
      attrs = {};
      remoteAttrs = {};
      container = new canMap();
    });

    it('resolves server change', () => {
      const key = 'field';
      baseAttrs[key] = '1';
      attrs[key] = '1';
      remoteAttrs[key] = '2';

      const hasConflict = simpleFieldResolver(
        baseAttrs,
        attrs,
        remoteAttrs,
        container,
        key);

      expect(hasConflict).toBe(false);
    });

    it('resolves local change', () => {
      const key = 'field';
      baseAttrs[key] = '1';
      attrs[key] = '2';
      remoteAttrs[key] = '1';

      const hasConflict = simpleFieldResolver(
        baseAttrs,
        attrs,
        remoteAttrs,
        container,
        key);

      expect(hasConflict).toBe(false);
    });

    it('resolves the same server and local change', () => {
      const key = 'field';
      baseAttrs[key] = '1';
      attrs[key] = '2';
      remoteAttrs[key] = '2';

      const hasConflict = simpleFieldResolver(
        baseAttrs,
        attrs,
        remoteAttrs,
        container,
        key);

      expect(hasConflict).toBe(false);
      expect(container.attr(key)).toBe('2');
    });

    it('does not resolve different server and local change', () => {
      const key = 'field';
      baseAttrs[key] = '1';
      attrs[key] = '2';
      remoteAttrs[key] = '3';

      const hasConflict = simpleFieldResolver(
        baseAttrs,
        attrs,
        remoteAttrs,
        container,
        key);

      expect(hasConflict).toBe(true);
    });
  });

  describe('customAttributeResolver', () => {
    let previousValue;
    let currentValue;
    let remoteValue;
    let container;

    beforeEach(() => {
      previousValue = [];
      currentValue = [];
      remoteValue = [];
    });

    describe('checks attribute value and', () => {
      it('resolves change of different fields', () => {
        previousValue = [{
          custom_attribute_id: 1,
          attribute_value: '1-1',
        }, {
          custom_attribute_id: 2,
          attribute_value: '2-1',
        }];
        currentValue = [{
          custom_attribute_id: 1,
          attribute_value: '1-2',
        }, {
          custom_attribute_id: 2,
          attribute_value: '2-1',
        }];
        remoteValue = [{
          custom_attribute_id: 1,
          attribute_value: '1-1',
        }, {
          custom_attribute_id: 2,
          attribute_value: '2-2',
        }];
        container = new canList(remoteValue);

        const hasConflict = customAttributeResolver(
          previousValue,
          currentValue,
          remoteValue,
          container);

        expect(hasConflict).toBe(false);
        expect(container.attr('0.attribute_value')).toBe('1-2');
        expect(container.attr('1.attribute_value')).toBe('2-2');
      });

      it('resolves server change', () => {
        previousValue = [{
          custom_attribute_id: 1,
          attribute_value: '1',
        }];
        currentValue = [{
          custom_attribute_id: 1,
          attribute_value: '1',
        }];
        remoteValue = [{
          custom_attribute_id: 1,
          attribute_value: '2',
        }];
        container = new canList(remoteValue);

        const hasConflict = customAttributeResolver(
          previousValue,
          currentValue,
          remoteValue,
          container);

        expect(hasConflict).toBe(false);
        expect(container.attr('0.attribute_value')).toBe('2');
      });

      it('resolves local change', () => {
        previousValue = [{
          custom_attribute_id: 1,
          attribute_value: '1',
        }];
        currentValue = [{
          custom_attribute_id: 1,
          attribute_value: '2',
        }];
        remoteValue = [{
          custom_attribute_id: 1,
          attribute_value: '1',
        }];
        container = new canList(remoteValue);

        const hasConflict = customAttributeResolver(
          previousValue,
          currentValue,
          remoteValue,
          container);

        expect(hasConflict).toBe(false);
        expect(container.attr('0.attribute_value')).toBe('2');
      });

      it('resolves the same local and server change', () => {
        previousValue = [{
          custom_attribute_id: 1,
          attribute_value: '1',
        }];
        currentValue = [{
          custom_attribute_id: 1,
          attribute_value: '2',
        }];
        remoteValue = [{
          custom_attribute_id: 1,
          attribute_value: '2',
        }];
        container = new canList(remoteValue);

        const hasConflict = customAttributeResolver(
          previousValue,
          currentValue,
          remoteValue,
          container);

        expect(hasConflict).toBe(false);
        expect(container.attr('0.attribute_value')).toBe('2');
      });

      it('does not resolve different local and server change', () => {
        previousValue = [{
          custom_attribute_id: 1,
          attribute_value: '1',
        }];
        currentValue = [{
          custom_attribute_id: 1,
          attribute_value: '2',
        }];
        remoteValue = [{
          custom_attribute_id: 1,
          attribute_value: '3',
        }];
        container = new canList(remoteValue);

        const hasConflict = customAttributeResolver(
          previousValue,
          currentValue,
          remoteValue,
          container);

        expect(hasConflict).toBe(true);
      });
    });

    describe('checks attribute objects and', () => {
      it('resolves change of different fields', () => {
        previousValue = [{
          custom_attribute_id: 1,
          attribute_objects: [{id: 1}, {id: 3}],
        }, {
          custom_attribute_id: 2,
          attribute_objects: [{id: 1}, {id: 3}],
        }];
        currentValue = [{
          custom_attribute_id: 1,
          attribute_objects: [{id: 2}, {id: 3}],
        }, {
          custom_attribute_id: 2,
          attribute_objects: [{id: 1}, {id: 3}],
        }];
        remoteValue = [{
          custom_attribute_id: 1,
          attribute_objects: [{id: 1}, {id: 3}],
        }, {
          custom_attribute_id: 2,
          attribute_objects: [{id: 2}, {id: 3}],
        }];
        container = new canList(remoteValue);

        const hasConflict = customAttributeResolver(
          previousValue,
          currentValue,
          remoteValue,
          container);

        expect(hasConflict).toBe(false);
        expect(container.attr('0.attribute_objects').attr())
          .toEqual([{id: 2}, {id: 3}]);
        expect(container.attr('1.attribute_objects').attr())
          .toEqual([{id: 2}, {id: 3}]);
      });

      it('resolves server change', () => {
        previousValue = [{
          custom_attribute_id: 1,
          attribute_objects: [{id: 1}, {id: 3}],
        }];
        currentValue = [{
          custom_attribute_id: 1,
          attribute_objects: [{id: 1}, {id: 3}],
        }];
        remoteValue = [{
          custom_attribute_id: 1,
          attribute_objects: [{id: 2}, {id: 3}],
        }];
        container = new canList(remoteValue);

        const hasConflict = customAttributeResolver(
          previousValue,
          currentValue,
          remoteValue,
          container);

        expect(hasConflict).toBe(false);
        expect(container.attr('0.attribute_objects').attr())
          .toEqual([{id: 2}, {id: 3}]);
      });

      it('resolves local change', () => {
        previousValue = [{
          custom_attribute_id: 1,
          attribute_objects: [{id: 1}, {id: 3}],
        }];
        currentValue = [{
          custom_attribute_id: 1,
          attribute_objects: [{id: 2}, {id: 3}],
        }];
        remoteValue = [{
          custom_attribute_id: 1,
          attribute_objects: [{id: 1}, {id: 3}],
        }];
        container = new canList(remoteValue);

        const hasConflict = customAttributeResolver(
          previousValue,
          currentValue,
          remoteValue,
          container);

        expect(hasConflict).toBe(false);
        expect(container.attr('0.attribute_objects').attr())
          .toEqual([{id: 2}, {id: 3}]);
      });

      it('resolves the same local and server change', () => {
        previousValue = [{
          custom_attribute_id: 1,
          attribute_objects: [{id: 1}, {id: 3}],
        }];
        currentValue = [{
          custom_attribute_id: 1,
          attribute_objects: [{id: 2}, {id: 3}],
        }];
        remoteValue = [{
          custom_attribute_id: 1,
          attribute_objects: [{id: 2}, {id: 3}],
        }];
        container = new canList(remoteValue);

        const hasConflict = customAttributeResolver(
          previousValue,
          currentValue,
          remoteValue,
          container);

        expect(hasConflict).toBe(false);
        expect(container.attr('0.attribute_objects').attr())
          .toEqual([{id: 2}, {id: 3}]);
      });

      it('resolve different local and server change', () => {
        previousValue = [{
          custom_attribute_id: 1,
          attribute_objects: [{id: 1}, {id: 4}],
        }];
        currentValue = [{
          custom_attribute_id: 1,
          attribute_objects: [{id: 2}, {id: 4}],
        }];
        remoteValue = [{
          custom_attribute_id: 1,
          attribute_objects: [{id: 3}, {id: 4}],
        }];
        container = new canList(currentValue);

        customAttributeResolver(
          previousValue,
          currentValue,
          remoteValue,
          container);

        const expectedResult = [{
          custom_attribute_id: 1,
          attribute_objects: [{id: 3}, {id: 4}, {id: 2}],
        }];
        expect(container.attr()).toEqual(expectedResult);
      });
    });
  });
  describe('resolveAttributeObjects', () => {
    it('should add new objects when they were added on server', () => {
      const previousObjects = [{id: 1}];
      const currentObjects = [{id: 2}];
      const remoteObjects = [{id: 2}, {id: 3}];
      const expectedResult = [{id: 2}, {id: 3}];
      const resolvedAttributeObjects =
        resolveAttributeObjects(previousObjects, currentObjects, remoteObjects);
      expect(resolvedAttributeObjects).toEqual(expectedResult);
    });

    it('should delete objects when they were deleted on server', () => {
      const previousObjects = [{id: 1}, {id: 2}];
      const currentObjects = [{id: 1}];
      const remoteObjects = [];
      const expectedResult = null;
      const resolvedAttributeObjects =
        resolveAttributeObjects(previousObjects, currentObjects, remoteObjects);
      expect(resolvedAttributeObjects).toBe(expectedResult);
    });

    it('should add objects at the local when they were added on server and put'
      + 'to the server objects that was added local', () => {
      const previousObjects = [];
      const currentObjects = [{id: 1}];
      const remoteObjects = [{id: 2}];
      const expectedResult = [{id: 2}, {id: 1}];
      const resolvedAttributeObjects =
        resolveAttributeObjects(previousObjects, currentObjects, remoteObjects);
      expect(resolvedAttributeObjects).toEqual(expectedResult);
    });
  });
});
