/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loIsNumber from 'lodash/isNumber';
import loForEach from 'lodash/forEach';
import loMap from 'lodash/map';
import {ggrcAjax} from '../plugins/ajax_extensions';
import tracker from '../tracker';

/*  SaveQueue
  *
  *  SaveQueue is used by Cacheable to prevent firing
  *  multiple requests to the server at once. It makes sure the requests
  *  are grouped together (inside _queue) and then resolved in batches.
  *
  *  It will also try to group POST request and use the custom collection post
  *  API and then redistribute responses in order to trace in latency for
  *  throughput. This is done by a "thread" (of timeouts) per object type (per
  *  bucket) that enqueues as a regular request but then greedily dispatches
  *  requests that arrived while it was in the queue.
  *
  *  enqueue(obj: Cacheable, save_args) -> null
  */
const DELAY = 100; // Number of ms to wait before the first batch is fired
const BATCH = GGRC.config.MAX_INSTANCES || 3; // Maximum number of POST/PUT requests at any given time
const BATCH_SIZE = 1000;
const _queue = [];
const _buckets = {};
let _timeout = null;

function _enqueueBucket(bucket) {
  return function () {
    let size = bucket.background ? bucket.objs.length : BATCH_SIZE;
    let objs = bucket.objs.splice(0, size);
    let body = loMap(objs, function (obj) {
      let list = {};
      list[bucket.type] = obj.serialize();
      return list;
    });
    let modelType = objs[0].constructor.model_singular;
    let stopFn = tracker.start(modelType,
      tracker.USER_JOURNEY_KEYS.API,
      tracker.USER_ACTIONS.CREATE_OBJECT(objs.length));
    let dfd = ggrcAjax({
      type: 'POST',
      url: '/api/' + bucket.plural,
      data: body,
      beforeSend: function (xhr) {
        if (bucket.background) {
          xhr.setRequestHeader('X-GGRC-BackgroundTask', 'true');
        }
      },
    }).promise();
    dfd.always(function (data, type) {
      if (type === 'error') {
        stopFn(true);
        objs.forEach(function (obj) {
          obj._dfd.reject(data);
        });
      }
      if ('background_task' in data) {
        stopFn(true);
        let task = data.background_task;
        // Resolve all the dfds with the task
        objs.forEach(function (obj) {
          obj._dfd.resolve(task);
        });
      }

      stopFn();

      // Push the response to a queue for later processing.
      bucket.save_responses.push([objs, data]);
    }).always(function () {
      if (bucket.objs.length) {
        _step(_enqueueBucket(bucket));
      } else {
        // Process all of the batches of save responses.
        _processSaveResponses(bucket);
        bucket.in_flight = false;
      }
    });

    return dfd;
  };
}

function _processSaveResponses(bucket) {
  bucket.save_responses.forEach(function (resp) {
    let objs = resp[0];
    let data = resp[1];
    let cb = function (single) {
      return function () {
        this.created(single[1][bucket.type]);
        return $.Deferred().resolve(this);
      };
    };
    loForEach(objs, function (obj, idx) {
      let single = data[idx];
      // Add extra check to avoid possible exceptions
      single = Array.isArray(single) ? single : false;
      if (single && single[0] >= 200 && single[0] < 300) {
        obj._save(cb(single));
      } else {
        obj._dfd.reject(obj, single);
      }
    });
  });

  bucket.save_responses.length = 0;
}

function _step(elem) {
  _queue.push(elem);
  if (loIsNumber(_timeout)) {
    clearTimeout(_timeout);
  }
  _timeout = setTimeout(() => {
    _resolve(_queue.splice(0, _queue.length));
  }, DELAY);
}

function _resolve(queue) {
  let objs;
  if (!queue.length) {
    // Finished
    return;
  }
  objs = queue.splice(0, BATCH);
  $.when(...objs.map((fn) => {
    return fn();
  }))
    .always(_resolve.bind(null, queue)); // Move on to the next one
}

function enqueue(obj, _saveSuper) {
  let type;
  let bucket;
  let bucketName;
  let plural;
  let elem = function () {
    let stopFn = tracker
      .start(obj.constructor.model_singular,
        tracker.USER_JOURNEY_KEYS.API,
        tracker.USER_ACTIONS.UPDATE_OBJECT);
    return obj._save(_saveSuper).then((objects) => {
      stopFn();
      return objects;
    }, stopFn.bind(null, true));
  };
  if (obj.isNew()) {
    type = obj.constructor.table_singular;
    bucketName = type + (obj.run_in_background ? '_bg' : '');
    bucket = _buckets[bucketName];

    if (bucket === undefined) {
      plural = obj.constructor.table_plural;
      bucket = {
        objs: [],
        type: type,
        plural: plural,
        background: obj.run_in_background,
        // List of batch request responses that are yet to be processed.
        save_responses: [],
        in_flight: false, // is there a "thread" running for this bucket
      };
      _buckets[bucketName] = bucket;
    }
    bucket.objs.push(obj);
    if (bucket.in_flight) {
      return;
    }
    elem = _enqueueBucket(bucket);
    bucket.in_flight = true;
  }
  _step(elem);
}

export default enqueue;
export {
  _processSaveResponses,
};
