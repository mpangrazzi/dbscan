
/**
 * Module dependencies
 */

var test = require('tape');
var DBSCAN = require('..');

var dataset = [
  [1, 1, 0],
  [0, 1, 0],
  [1, 0, 0],
  [10, 10, 0],
  [10, 13, 0],
  [13, 13, 0],
  [54, 54, 0],
  [55, 55, 0],
  [89, 89, 0],
  [57, 55, 0]
];


test('should throw if epsilon or minPoints params are missing', function (t) {

  t.plan(3);

  t.throws(function() {
    var dbscan = DBSCAN();
  }, 'Missing params');

  t.throws(function() {
    var dbscan = DBSCAN({ epsilon: 5 });
  }, 'Missing `minPoints` param');

  t.throws(function() {
    var dbscan = DBSCAN({ minPoints: 5 });
  }, 'Missing `epsilon` param');

});


test('should throw if epsilon or minPoints params are invalid', function (t) {

  t.plan(2);

  t.throws(function() {
    var dbscan = DBSCAN({ minPoints: 5, epsilon: true });
  }, 'Invalid `epsilon` param');

  t.throws(function() {
    var dbscan = DBSCAN({ minPoints: 'test', epsilon: 3 });
  }, 'Invalid `epsilon` param');

});


test('should get an instance of DBSCAN', function (t) {

  t.plan(6);

  var dbscan = DBSCAN({
    epsilon: 5,
    minPoints: 3
  });

  t.equal(dbscan.epsilon, 5, '`epsilon` param is ok');
  t.equal(dbscan.minPoints, 3, '`minPoints` param is ok');
  t.equal(typeof dbscan.process, 'function', 'dbscan instance is valid');
  t.equal(dbscan.clusters.length, 0);
  t.equal(dbscan.noise.length, 0);
  t.equal(dbscan.visited.length, 0);

});


test('should run correctly', function (t) {

  t.plan(4);

  var dbscan = DBSCAN({
    epsilon: 5,
    minPoints: 3
  });

  dbscan.process(dataset);

  var clusters = dbscan.getClusters();

  t.deepLooseEqual(clusters[0], [ [ 1, 1, 0 ], [ 0, 1, 0 ], [ 1, 0, 0 ] ]);
  t.deepLooseEqual(clusters[1], [ [ 10, 10, 0 ], [ 10, 13, 0 ], [ 13, 13, 0 ] ]);
  t.deepLooseEqual(clusters[2], [ [ 54, 54, 0 ], [ 55, 55, 0 ], [ 57, 55, 0 ] ]);
  t.deepLooseEqual(dbscan.noise, [ [ 89, 89, 0 ] ]);

});


test('should get computed clusters radius', function(t) {

  t.plan(3);

  var dbscan = DBSCAN({
    epsilon: 5,
    minPoints: 3
  });

  dbscan.process(dataset);

  var radiuses = dbscan.getClustersRadius();

  t.equal(radiuses[0], 0.6540388352636305);
  t.equal(radiuses[1], 1.9621165057908916);
  t.equal(radiuses[2], 1.220596558996163);

});
