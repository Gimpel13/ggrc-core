/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import * as AjaxExtensions from '../../../plugins/ajax-extensions';
import * as TreeViewUtils from '../../utils/tree-view-utils';
import * as SnapshotUtils from '../../utils/snapshot-utils';
import * as WidgetsUtils from '../../utils/widgets-utils';
import * as QueryAPI from '../../utils/query-api-utils';
import * as WidgetList from '../../../modules/widget-list';

describe('GGRC Utils Widgets', function () {
  describe('getWidgetList() method', function () {
    let method;

    beforeEach(function () {
      spyOn(WidgetList, 'getWidgetListFor')
        .and.returnValue({
          control: {},
          Assessment: {},
          objective: {},
        });
      method = WidgetsUtils.getWidgetList;
    });

    it('returns an empty object when model is not provided', function () {
      let result = method('', 'assessments_view');

      expect(result.assessment).toBeUndefined();
    });

    it('returns assessments widget for assessment view', function () {
      let result = method('assessment', '/assessments_view');
      let keys = Object.keys(result);

      expect(keys.length).toEqual(1);
      expect(keys).toContain('Assessment');
    });

    it('returns widgets for non-assessment view', function () {
      let result = method('assessment', '/controls_view');
      let keys = Object.keys(result);

      expect(keys.length).toEqual(3);
    });
  });

  describe('getDefaultWidgets() method', function () {
    let method;

    beforeEach(function () {
      method = WidgetsUtils.getDefaultWidgets;
    });

    it('should return "Info" widget for non-object browser path', function () {
      let result = method({
        control: {},
        assessment: {},
        objective: {},
        info: {},
      }, '/assessments_view');

      expect(result).toContain('info');
    });

    it('should return "Info" widget for non-object browser path', function () {
      let result = method({
        control: {},
        assessment: {},
        objective: {},
        info: {},
      }, '/objectBrowser/');

      expect(result).not.toContain('info');
    });
  });

  describe('getWidgetModels() method', function () {
    let method;

    beforeEach(function () {
      spyOn(WidgetList, 'getWidgetListFor')
        .and.returnValue({
          Control: {
            widgetType: 'treeview',
            content_controller_options: {
              model: {
                model_singular: 'Control',
              },
            },
          },
          Assessment: {
            widgetType: 'treeview',
            content_controller_options: {
              model: {
                model_singular: 'Assessment',
              },
            },
          },
          Objective: {
            widgetType: 'treeview',
            content_controller_options: {
              model: {
                model_singular: 'Objective',
              },
            },
          },
          Info: {
            content_controller_options: {
              model: {
                model_singular: 'Info',
              },
            },
          },
        });
      method = WidgetsUtils.getWidgetModels;
    });

    it('returns an empty array when model is not provided', function () {
      let result = method('', 'assessments_view');

      expect(result.length).toEqual(0);
    });

    it('returns assessment model name only for assessment view', function () {
      let result = method('assessment', '/assessments_view');

      expect(result).toContain('Assessment');
    });

    it('returns appropriate models for non-assessment view',
      function () {
        let result = method('assessment', '/controls_view');

        expect(result).toContain('Assessment');
        expect(result).toContain('Control');
        expect(result).toContain('Objective');
        expect(result.length).toEqual(3);
      });

    it('returns non-info models for object browser view',
      function () {
        let result = method('assessment', '/objectBrowser/');

        expect(result).toContain('Assessment');
        expect(result).toContain('Control');
        expect(result).toContain('Objective');
        expect(result).not.toContain('Info');
      });
  });

  describe('initCounts() method', () => {
    let method;
    let getCounts;
    let id = 1;

    beforeEach(() => {
      method = WidgetsUtils.initCounts;
      getCounts = WidgetsUtils.getCounts;

      spyOn(TreeViewUtils, 'makeRelevantExpression')
        .and.returnValue({
          type: 'Assessment',
          id: id,
          operation: 'owned',
        });
      spyOn(SnapshotUtils, 'isSnapshotRelated')
        .and.callFake((type, widgetType) => {
          return widgetType === 'Control';
        });
      spyOn(QueryAPI, 'buildParam')
        .and.callFake((objName) => ({
          objectName: objName,
        }));
    });

    it('should not make request when no widget was provided', () => {
      spyOn(QueryAPI, 'batchRequestsWithPromise');

      method([], 'Control', 1);

      expect(QueryAPI.batchRequestsWithPromise).not.toHaveBeenCalled();
    });

    it('should init counts for snapshotable objects', async () => {
      spyOn(SnapshotUtils, 'getSnapshotsCounts')
        .and.returnValue(Promise.resolve({
          Control: 11,
        }));

      await method(['Control'], 'Assessment', 1);

      const result = getCounts();

      expect(result.Control).toEqual(11);
    });

    it('should init counts for non-snapshotable objects',
      async () => {
        spyOn(SnapshotUtils, 'getSnapshotsCounts')
          .and.returnValue(Promise.resolve({}));
        spyOn(QueryAPI, 'batchRequestsWithPromise')
          .withArgs({
            type: 'count',
            objectName: 'Assessment',
          })
          .and.returnValue(Promise.resolve({
            Assessment: {
              total: 10,
            },
          }));

        await method(['Assessment'], 'Control', 1);

        const result = getCounts();

        expect(result.Assessment).toEqual(10);
      });

    it('should init counts for virtual objects', async () => {
      spyOn(SnapshotUtils, 'getSnapshotsCounts')
        .and.returnValue(Promise.resolve({}));
      spyOn(QueryAPI, 'batchRequestsWithPromise').withArgs({
        type: 'count',
        objectName: 'Cycle',
      }).and.returnValue(Promise.resolve({
        Cycle: {
          total: 10,
        },
      }));

      await method([{
        name: 'Cycle',
        countsName: 'ActiveCycle',
      }], 'Control', 1);

      const result = getCounts();

      expect(result.ActiveCycle).toEqual(10);
    });
  });

  describe('refreshCounts() method', function () {
    let widgets;
    let refreshCounts;
    let countsMap;
    let snapshotCountsDfd;

    beforeEach(function () {
      refreshCounts = WidgetsUtils.refreshCounts;
      countsMap = WidgetsUtils.getCounts();
      snapshotCountsDfd = $.Deferred();

      widgets =
        {
          Program: {
            widgetType: 'treeview',
            content_controller_options: {
              model: {
                model_singular: 'Program',
              },
            },
          },
          Assessment: {
            widgetType: 'treeview',
            content_controller_options: {
              model: {
                model_singular: 'Assessment',
              },
            },
          },
          Audit: {
            widgetType: 'treeview',
            content_controller_options: {
              model: {
                model_singular: 'Audit',
              },
            },
          },
        };

      spyOn(WidgetList, 'getWidgetListFor')
        .and.returnValue(widgets);

      spyOn(AjaxExtensions, 'ggrcAjax')
        .and.returnValues(
          $.Deferred().resolve(
            [
              {Program: {count: 0, total: 0}, selfLink: null},
              {Assessment: {count: 0, total: 0}, selfLink: null},
              {Audit: {count: 3, total: 4}, selfLink: null},
            ]));

      spyOn(SnapshotUtils, 'getSnapshotsCounts')
        .and.returnValue(snapshotCountsDfd);
    });

    it('should reinit counts', function (done) {
      snapshotCountsDfd.resolve({});

      refreshCounts()
        .then(function (counts) {
          let reqParams;
          let reqParamNames;
          let ggrcAjax = AjaxExtensions.ggrcAjax;

          expect(ggrcAjax.calls.count()).toEqual(1);
          reqParams = JSON.parse(ggrcAjax.calls.argsFor(0)[0].data);
          reqParamNames = reqParams.map((param) => param.object_name);
          expect(reqParams.length).toEqual(3);
          expect(reqParamNames).toContain('Program');
          expect(reqParamNames).toContain('Assessment');
          expect(reqParamNames).toContain('Audit');
          expect(countsMap.attr('Audit')).toEqual(4);
          expect(countsMap.attr('Program')).toEqual(0);
          done();
        });
    });
  });

  describe('getWidgetConfigs() method', function () {
    it('should return object configs', function () {
      const result = WidgetsUtils.getWidgetConfigs(
        [{name: 'Program'}, {name: 'Assessment'}]);
      expect(result).toEqual([{
        name: 'Program',
        widgetName: 'Program',
        widgetId: 'Program',
      }, {
        name: 'Assessment',
        widgetName: 'Assessment',
        widgetId: 'Assessment',
      }]);
    });
  });

  describe('getWidgetConfig() method', function () {
    it('should return object config if model name is Object', function () {
      const result = WidgetsUtils.getWidgetConfig({name: 'Program'});
      expect(result).toEqual({
        name: 'Program',
        widgetName: 'Program',
        widgetId: 'Program',
      });
    });

    it('should return object config if model name is cashed', function () {
      WidgetsUtils.getWidgetConfig('Program_version');
      const result = WidgetsUtils.getWidgetConfig('Program_version');
      expect(result).toEqual({
        name: 'Program',
        widgetId: 'Program_version',
        widgetName: 'Programs Versions',
        countsName: 'Program_version',
        isObjectVersion: true,
        relation: undefined,
        isMegaObject: undefined,
      });
    });

    it('should return object config if model name contains "_version"',
      function () {
        const result = WidgetsUtils.getWidgetConfig('Program_version');
        expect(result).toEqual({
          name: 'Program',
          widgetId: 'Program_version',
          widgetName: 'Programs Versions',
          countsName: 'Program_version',
          isObjectVersion: true,
          relation: undefined,
          isMegaObject: undefined,
        });
      }
    );

    it('should return object config if model name is mega object', function () {
      const result = WidgetsUtils.getWidgetConfig('Program_parent');
      expect(result).toEqual({
        name: 'Program',
        widgetId: 'Program_parent',
        widgetName: 'Programs (Parent)',
        countsName: 'Program_parent',
        isObjectVersion: undefined,
        relation: 'parent',
        isMegaObject: true,
      });
    });
  });
});
