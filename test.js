/**
 * @author Tarek Auel
 * @version 0.0.1
 */
/*var neo4j = require('./lib/neo4j.js');

var cypher = 'MATCH (d:Docent)-[r]->(o) ' +
             'RETURN labels(d) + d.id as source,type(r) as reason, labels(o) + o.id as target LIMIT 5';
var fs = require('fs');

var nodes = {};

neo4j.query(cypher, null,
    function (err, result, stats, body) {
        var expectedCallbacks = result.length,
            receivedCallbacks = 0;

        result.forEach(function(data) {
            if (!nodes[data.source]) {
                nodes[data.source] = {};
                nodes[data.source].id = "" + data.source;
                nodes[data.source].title = "" + data.source;
                nodes[data.source].dependencies = [];
            }
            if (!nodes[data.target]) {
                nodes[data.target] = {};
                nodes[data.target].id = "" + data.target;
                nodes[data.target].title = "" + data.target;
                nodes[data.target].dependencies = [];
            }
            nodes[data.target].dependencies.push(
                {
                    "source" : "" + data.source,
                    "reason" : "" + data.reason
                }
            );
            ++receivedCallbacks;
            if (expectedCallbacks === receivedCallbacks) {
                fs.writeFile('./nodes.json', JSON.stringify(nodes), function(err) {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log("The file was saved!");
                    }
                });
            }
        });
    });*/
start = Date.parse('2005-10-04 00:00:00' );
end = Date.parse('2005-10-04 23:59:00');

console.log(start);
console.log(end);
console.log(end-start);

