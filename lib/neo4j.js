/**
 * @author Tarek Auel
 */
var http = require('http');

// dummy object, will be replaced by setLogger, if
// logging should be activated
var logger = {
    info: function() {},
    warn: function() {},
    debug: function() {},
    verbose: function() {}
};

var checkStats = function(stats, expected) {
    logger.verbose('Checking stats');
    logger.verbose('Given stats: ' + JSON.stringify(stats));
    logger.verbose('Expected stats: ' + JSON.stringify(expected));

    var error = 'Stats are not like expected: \n',
        found = false,
        attr =
            [
                'relationships_created',
                'nodes_deleted',
                'relationship_deleted',
                'indexes_added',
                'properties_set',
                'constraints_removed',
                'indexes_removed',
                'labels_removed',
                'constraints_added',
                'labels_added',
                'nodes_created',
                'contains_updates'
            ];

    if (!expected)
        expected = {};

    attr.forEach(function(attr) {
        if (!expected[attr]) {
            if (attr === 'contains_updates') {
                expected[attr] = false;
            } else {
                expected[attr] = 0;
            }
        }

        if (stats[attr] !== expected[attr]) {
             var m =
                attr + ' ' +
                'was ' + stats[attr] + ' ' +
                'but expected ' + expected[attr] + '\n';
            error += '\t' + m;
            found = true;
            logger.warn(m)
        }
    });

    if (found) {
        return new Error(error);
    }
};

var setLog = function (log) {
    logger = log;
};

/**
 * Provide a logger for the database interface
 * @param logger the winston logging instance
 */
module.exports.setLogger = function (logger) {
    setLog(logger);
};

/**
 * Sends a cypher statement to the database
 * @param {string} statement the cypher statement that should be
 *      send to the database, e.g. "MATCH (n {props} ) RETURN n LIMIT 10;";
 * @param {object} parameters that are used for prepared
 *      statements e.g. {props: {id:1}}
 * @param {object} expectedStats object with expected stats results, see neo4j
 *      http://docs.neo4j.org/chunked/stable/rest-api-cypher.html#rest-api-retrieve-query-metadata
 * @param {function} callback a callback function that shall be called
 *      if the response is received.
 */
module.exports.query = function(statement,
                                    parameters,
                                    expectedStats,
                                    callback) {
    parameters = parameters || {};
    logger.debug('Statement: ' + statement);
    logger.debug('Parameter: ' + JSON.stringify(parameters));
    logger.debug('Expected stats: ' + JSON.stringify(expectedStats));
    var options = {
        host: 'localhost',
        port: '7474',
        method: 'POST',
        path: '/db/data/cypher?includeStats=true',
        headers: {
            'Accept': 'application/json; charset=UTF-8',
            'Content-Type': 'application/json'
        }
    };
    var body = {
            query: statement,
            params: parameters
        };

    var request = http.request(options, function(response) {
        var str = '';
        response.on('data', function(chunk) {
            str += chunk;
        });
        response.on('end', function() {
            logger.verbose('Response' + str);
            var response = JSON.parse(str),
                data = [];
            if (response) {
                if (response.exception) {
                    logger.warn(body);
                    callback(new Error(response.message));
                }
                var err = checkStats(response.stats, expectedStats);
                if (err) {
                    logger.warn(err);
                    callback(err);
                }
                if (!response.data) {
                    logger.debug('Response has no data');
                    callback();
                }
                response.data.forEach(function(value) {
                    var newObj = {};
                    value.forEach(function(prop, index) {
                        newObj[response.columns[index]] = prop;
                    });
                    data.push(newObj);
                });
                logger.debug('Response object: ' + JSON.stringify(data));
                callback(null, data);
            } else {
                logger.warn('Empty response!');
                callback(new Error('Response was empty: ' +
                    JSON.stringify(body)));
            }
        });
    });
    request.write(JSON.stringify(body));
    request.end();
};
