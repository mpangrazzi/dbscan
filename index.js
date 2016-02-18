
/**
 * Module dependencies
 */

var debug = require('debug')('dbscan');
var objectAssign = require('object-assign');


module.exports = function (params) {

  if (typeof params.epsilon !== 'number') {
    throw new TypeError('option `epsilon` must be a number');
  }

  if (typeof params.minPoints !== 'number') {
    throw new TypeError('option `minPoints` must be a number');
  }

  debug('DBSCAN', params);

  var init = {
    clusters: [],
    visited: [],
    noise: []
  };

  return objectAssign(Object.create(DBSCAN), init, params);

};


/**
 * DBSCAN prototype
 *
 * @type {Object}
 */

var DBSCAN = {

  /**
   * Check if a point is visited or noise
   *
   * @param  {Array} point
   * @return {Boolean}
   */

  isVisited: function (point) {

    var visited = this.visited.some(function (p) {
      return equal(point, p);
    });

    var noise = this.noise.some(function (p) {
      return equal(point, p);
    });

    return visited || noise;

  },

  /**
   * Returns the union of two arrays, without dups
   *
   * @param  {Array} a
   * @param  {Array} b
   * @return {Array}
   */

  _union: function (a, b) {

    var result = a;

    for (var i = 0, l = b.length; i < l; i++) {

      var present = result.some(function (p) {
        return equal(p, b[i]);
      });

      if (!present) result.push(b[i]);

    }

    return result;

  },

  /**
   * Check if a point is in a cluster
   *
   * @param  {Array} point
   * @return {Boolean}
   */

  inClusters: function inClusters (point) {

    return this.clusters.some(function (c) {

      return c.some(function (p) {
        return equal(point, p);
      });

    });

  },

  /**
   * Main DBSCAN process function
   *
   * @param  {Array[]} data [description]
   * @return {undefined}
   */

  process: function (data) {

    for (var i = 0, l = data.length; i < l; i++) {

      // Get current point

      var point = data[i];
      debug('current point', point, i);

      // Continue or mark current point as visited

      if (this.isVisited(point)) {
        debug('point is already visited', this.visited, point);
        continue;
      }

      debug('marking point as visited', this.visited, point);
      this.visited.push(point);

      // Region querying point

      var neighbours = regionQuery(data, point, this.epsilon);
      debug('detected neighbours', neighbours, i);

      // Check if current point neighbours are noise

      debug('length minPoints', neighbours.length, this.minPoints);

      if (neighbours.length < this.minPoints) {
        this.noise.push(point);
        debug('noise added', point, this.noise);
      } else {

        // create new cluster and expand it

        var clusterIndex = this.clusters.push([]) - 1;
        debug('created cluster', clusterIndex);

        this._expandCluster(point, neighbours, clusterIndex);

      }

    }

    debug('processing done');

  },

  /**
   * Expand a cluster starting from a point and his neighbours
   *
   * @param  {Array} point
   * @param  {Array[]} neighbours
   * @param  {number} clusterIndex
   * @return {undefined}
   */

  _expandCluster: function (point, neighbours, clusterIndex) {

    // Add point to [clusterIndex]

    this.clusters[clusterIndex].push(point);
    debug('added point to cluster', point, clusterIndex);

    for (var i = 0, l = neighbours.length; i < l; i++) {

      var neighbour = neighbours[i];

      if (!this.isVisited(neighbour)) {

        debug('neighbour not visited', neighbour, this.visited);
        this.visited.push(neighbour);
        debug('marking neighbour as visited', neighbour, this.visited);

        debug('looking for other neighbours', neighbour, this.epsilon);
        var otherNeighbours = regionQuery(neighbour, this.epsilon);
        debug('found other neighbours', neighbours);

        if (otherNeighbours.length >= this.minPoints) {
          neighbours = neighbours._union(otherNeighbours);
        }

      }

      if (!this.inClusters(neighbour)) {
        this.clusters[clusterIndex].push(neighbour);
        debug('added neighbour to cluster', neighbour, clusterIndex);
      }

    }

  },

  /**
   * Get radius of each computed clusters
   *
   * @return {Array}
   */

  getClustersRadius: function getClustersRadius () {

    var clusters = this.getClusters();

    return this.getCentroids().map(function (c, index) {

      var cluster = clusters[index];
      var t = 0;
      var l = cluster.length;

      for (var i = 0; i < l; i++) {
        t += distance(c, cluster[i]);
      }

      return Math.sqrt(Math.pow(t / l, 2));

    });

  },

  /**
   * Get the centroids of computed clusters
   *
   * @return {Array}
   */

  getCentroids: function () {

    if (this.centroids) {
      return this.centroids;
    }

    this.centroids = this.getClusters().map(function (c) {

      var l = c.length;
      var t = c.reduce(function (p, n) {
        return [p[0] + n[0], p[1] + n[1], p[2] + n[2]];
      });

      return [t[0]/l, t[1]/l, t[2]/l];

    });

    return this.centroids;

  },

  /**
   * Get computed clusters
   *
   * @return {Array[]}
   */

  getClusters: function () {

    if (this.filteredClusters) {
      return this.filteredClusters;
    }

    this.filteredClusters = this.clusters.filter(function (c) {

      if (c.length >= this.minPoints) {
        return c;
      }

    }.bind(this));

    return this.filteredClusters;

  },

  /**
   * Get all the computed cluster's data in a flatten version
   *
   * @return {Array[]}
   */

  getData: function () {

    return this.getClusters().reduce(function (p, n) {
      return p.concat(n);
    });

  }

};


/**
 * Query a region around a point with an {epsilon} radius
 *
 * @param  {Array[]} data
 * @param  {Array} point
 * @param  {number} epsilon
 * @return {Array[]}
 */

function regionQuery (data, point, epsilon) {

  return data.filter(function (p) {
    return distance(point, p) <= epsilon;
  });

}

/**
 * Euclidean distance between two points
 *
 * @param  {Array} p1
 * @param  {Array} p2
 * @return {number}
 */

function distance (p1, p2) {

  var total = 0;

  for (var i = 0, l = 3; i < l; i++) {
    total += Math.pow(p1[i] - p2[i], 2);
  }

  return Math.sqrt(total);

}

/**
 * Check if two 3D points are equal
 *
 * @param  {Array} p1
 * @param  {Array} p2
 * @return {Boolean}
 */

function equal (p1, p2) {

  return p1[0] === p2[0] &&
    p1[1] === p2[1] &&
    p1[2] === p2[2];

}
