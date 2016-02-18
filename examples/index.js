
/**
 * Module dependencies
 */

var DBSCAN = require('../index');

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

var dbscan = DBSCAN({
  epsilon: 5,
  minPoints: 3
});

dbscan.process(dataset);

dbscan.getClusters().forEach(function (c, index) {
  console.log('cluster', index, c);
});

console.log('noise', dbscan.noise);
console.log('centroids', dbscan.getCentroids());
console.log('clusters radius', dbscan.getClustersRadius());
