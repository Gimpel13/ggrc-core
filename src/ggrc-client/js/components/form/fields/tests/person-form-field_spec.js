/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../../js_specs/spec-helpers';
import Component from '../person-form-field';
import canMap from 'can-map';

describe('person-form-field component', function () {
  'use strict';
  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
    spyOn(viewModel, 'dispatch');
    viewModel.attr('fieldId', 1);
  });

  it('adds a person and dispatch valueChanged event' +
   'if new person is not in the list', function () {
    viewModel.attr('value', [{id: 1}]);
    viewModel.dispatch.calls.reset();
    viewModel.addPerson({selectedItem: {id: 2}});
    const dispatchedObject = viewModel.dispatch.calls.allArgs()[0][0];
    expect(dispatchedObject.value[0].id).toEqual(1);
    expect(dispatchedObject.value[1].id).toEqual(2);
  });

  it('does not dispatch valueChanged event' +
    ' on first value assignation', function () {
    viewModel.attr('value', undefined);
    expect(viewModel.dispatch).not.toHaveBeenCalled();
  });

  it('does not fire valueChanged event' +
    'if new person is already in the list', function () {
    viewModel.attr('value', [{id: 1}, {id: 2}]);
    viewModel.dispatch.calls.reset();
    viewModel.addPerson({selectedItem: new canMap({id: 2})});
    expect(viewModel.dispatch).not.toHaveBeenCalled();
  });

  it('removes a person and dispatch valueChanged event', function () {
    const attributeObject1 = new canMap({id: 1});
    const attributeObject2 = new canMap({id: 2});
    viewModel.attr('value', [attributeObject1, attributeObject2]);
    viewModel.dispatch.calls.reset();
    viewModel.removePerson({person: {id: 2}}, null, new Event('mock'));
    expect(viewModel.dispatch).toHaveBeenCalledWith({
      type: 'valueChanged',
      fieldId: 1,
      value: [attributeObject1],
    });
  });
});
