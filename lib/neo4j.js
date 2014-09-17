/**
 * @author Tarek Auel
 * @since Sep 15, 2014
 */
var http = require("http");

var exports;
module.exports = exports;

exports.query = function(statement, parameters, callback) {
    var options = {
        host: "localhost",
        port: "7474",
        method: "POST",
        path: "/db/data/cypher?includeStats=true",
        headers: {
            "Accept": "application/json; charset=UTF-8",
            "Content-Type": "application/json"
        }
    };
    var body = {
            query: statement,
            params: parameters
        };

    var request = http.request(options, function(response) {
        var str = "";
        response.on("data", function(chunk) {
            str += chunk;
        });
        response.on("end", function() {
            console.log("Received response: " + str);
            var result = JSON.parse(str),
                data = [];
            if (result) {
                result.data.forEach(function (value) {
                    value.forEach(function(row) {
                        data.push(row.data);
                    });
                });
                callback(null, data, result.stats, body);
            } else {
                callback(null, data);
            }
        });
    });
    request.write(JSON.stringify(body));
    request.end();
};