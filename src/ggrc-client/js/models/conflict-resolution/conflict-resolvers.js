/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loGet from 'lodash/get';
import loKeyBy from 'lodash/keyBy';
import loIsEqual from 'lodash/isEqual';
import loFind from 'lodash/find';
import loFilter from 'lodash/filter';

export function buildChangeDescriptor(
  previousValue,
  currentValue,
  remoteValue) {
  // The object attribute was changed on the server
  const isChangedOnServer = !loIsEqual(previousValue, remoteValue);
  // The object attribute was changed on the client
  const isChangedLocally = !loIsEqual(previousValue, currentValue);
  // The change on the server was not the same as the change on the client
  const isDifferent = !loIsEqual(currentValue, remoteValue);

  const hasConflict = (isChangedOnServer && isChangedLocally && isDifferent);

  return {
    hasConflict,
    isChangedLocally,
  };
}

export function simpleFieldResolver(
  baseAttrs = {},
  attrs = {},
  remoteAttrs = {},
  container,
  key,
  rootKey) {
  const previousValue = loGet(baseAttrs, key);
  const currentValue = loGet(attrs, key);
  const remoteValue = loGet(remoteAttrs, key);

  const {hasConflict, isChangedLocally} = buildChangeDescriptor(
    previousValue,
    currentValue,
    remoteValue);

  if (isChangedLocally && !hasConflict) {
    const path = rootKey || key;
    const currentRoot = loGet(attrs, path);
    container.attr(path, currentRoot);
  }

  return hasConflict;
}


export function customAttributeResolver(
  previousValue = [],
  currentValue = [],
  remoteValue = [],
  container = []) {
  const currentValuesById = loKeyBy(currentValue, 'custom_attribute_id');
  const remoteValuesById = loKeyBy(remoteValue, 'custom_attribute_id');
  const containerValuesById = loKeyBy(container, 'custom_attribute_id');

  let conflict = false;
  previousValue.forEach((previousValueItem) => {
    const definitionId = previousValueItem.custom_attribute_id;
    const currentValueItem = currentValuesById[definitionId];
    const remoteValueItem = remoteValuesById[definitionId];
    const containerValueItem = containerValuesById[definitionId];

    const hasValueConflict = simpleFieldResolver(
      previousValueItem,
      currentValueItem,
      remoteValueItem,
      containerValueItem,
      'attribute_value');

    const hasObjectsConflict = simpleFieldResolver(
      previousValueItem,
      currentValueItem,
      remoteValueItem,
      containerValueItem,
      'attribute_objects');

    if (hasObjectsConflict) {
      const resolvedAttributeObjects = resolveAttributeObjects(
        previousValueItem.attribute_objects,
        currentValueItem.attribute_objects,
        remoteValueItem.attribute_objects);
      containerValueItem.attr('attribute_objects', resolvedAttributeObjects);
    }

    conflict = conflict || hasValueConflict;
  });

  return conflict;
}

export function resolveAttributeObjects(
  previousObjects,
  currentObjects,
  remoteObjects) {
  const deletedObjects =
    loFilter(previousObjects,
      (previousObjectsEl) => !loFind(currentObjects,
        (currentObjectsEl) => currentObjectsEl.id === previousObjectsEl.id));
  const addedObjects =
    loFilter(currentObjects,
      (currentObjectsEl) => !loFind(previousObjects,
        (previousObjectsEl) => currentObjectsEl.id === previousObjectsEl.id));
  // array of objects from server without objects that was deleted on client
  const remoteObjsWithoutDeleted =
    loFilter(remoteObjects,
      (remoteObjectsEl) => !loFind(deletedObjects,
        (deletedObjectsEl) => deletedObjectsEl.id === remoteObjectsEl.id));
  // array of objects that was added on client and do not have copies on the server
  const shouldBeAddedRemotly =
    loFilter(addedObjects,
      (addedObjectsEl) => !loFind(remoteObjects,
        (remoteObjectsEl) => addedObjectsEl.id === remoteObjectsEl.id));
  const resolvedAttributeObjects = [...remoteObjsWithoutDeleted,
    ...shouldBeAddedRemotly];
  return resolvedAttributeObjects.length ? resolvedAttributeObjects : null;
}
