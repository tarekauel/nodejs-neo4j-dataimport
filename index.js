/**
 * @author Tarek Auel
 * @since Sep 15, 2014
 */
var neo4j   = require('./lib/neo4j.js'),
    fs      = require('fs'),
    docent  = require('./lib/docent.js'),
    lecture = require('./lib/lecture.js');

var self = this;
// create status nodes
this.saveStatus = function () {
    var status =
        [
            { label: "Neu", id: 1 },
            { label: "Aktiv", id: 2 },
            { label: "Inaktiv", id: 3 }
        ];
    var cypherStatement = "CREATE (s:Status {props}) RETURN s;";
    var expectedCallbacks = status.length;
    var receivedCallbacks = 0;
    status.forEach(function (status) {
        var parameter = {props: status};
        neo4j.query(cypherStatement, parameter, function(err, result, stats, body) {
            if (stats.nodes_created !== 1) {
                throw new Error("Error while creating node. " + JSON.stringify(body));
            }
            ++receivedCallbacks;
            if (expectedCallbacks === receivedCallbacks) {
                self.saveDocents();
            }
        });
    });
};



// create lecture types
this.saveLectureTypes = function () {
    var type = [
        { id: 0 },
        { id: 1 },
        { id: 2 }
    ];
    var cypherStatement = "CREATE (lt:LectureType {props}) RETURN lt;";
    var expectedCallbacks = type.length;
    var receivedCallbacks = 0;
    type.forEach(function (type) {
        var parameter = {props: type};
        neo4j.query(cypherStatement, parameter, function(err, result, stats, body) {
            console.log("Saved a lecture type");
            if (stats.nodes_created !== 1) {
                throw new Error("Error while creating node. " + JSON.stringify(body));
            }
            ++receivedCallbacks;
            if (expectedCallbacks === receivedCallbacks) {
                self.saveLectures();
            }
        });
    });
};

// create the old docents
this.saveDocents = function() { fs.readFile('./data/dozenten.json', 'utf8', function (err, data) {
    if (err) {
        return console.log(err);
    }
    console.log("Read \"dozentent.json\" successfully");
    var docentArray = JSON.parse(data);
    var expectedCallbacks = docentArray.length;
    var receivedCallback = 0;
    docentArray.forEach(function (docentOld) {
        var docentMapped = new docent(docentOld);
        var parameter = { props: docentMapped};
        var cypherStatement = "MATCH (s:Status {id:" + docentOld.idStatus + "}) CREATE (d:Docent {props} ), d-[:hasStatus]->(s) RETURN d;";
        neo4j.query(cypherStatement, parameter, function(err, result, stats, body) {
            if (stats.nodes_created !== 1 || stats.relationships_created !== 1) {
                throw new Error("Error while creating node. " + JSON.stringify(body));
            }
            console.log("Saved a docent");
            receivedCallback++;
            if (expectedCallbacks === receivedCallback) {
                self.saveTeachings();
                console.log("Finished importing docents");
            }
        });
    });

})};

// load connections between docent and lecture
var numOfCallsOfSaveTeachings = 0;
this.saveTeachings = function() {
    ++numOfCallsOfSaveTeachings;
    if (numOfCallsOfSaveTeachings < 2) {
        return;
    }
    fs.readFile('./data/dozent_lehrt.json', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        console.log("Read \"dozent_lehrt.json\" successfully");
        var teachesArray = JSON.parse(data);
        var expectedCallbacks = teachesArray.length;
        var receivedCallbacks = 0;
        teachesArray.forEach(function (teaches){

            if (teaches.idDozent == 0) {
                console.log("Skipped a teaching (docent does not exist");
                return;
            }

            if ([0, 508].indexOf(teaches.idFach) !== -1 ) {
                console.log("Skipped a teaching (lecture does not exist)");
                return;
            }

            var cypherStatement = "MATCH (d:Docent {id:\""+ teaches.idDozent  +"\"}), (l:Lecture {id:\""+ teaches.idFach  +"\"}) CREATE (d)-[:teaches]->(l) RETURN d,l;";
            neo4j.query(cypherStatement, {}, function(err, result, stats, body){
                if (stats.relationships_created !== 1) {
                    throw new Error("Error while creating node. " + JSON.stringify(body));
                }
                console.log("Saved a teaching");
                ++receivedCallbacks;
                if (expectedCallbacks === receivedCallbacks) {
                    loadedDocentTeachesLecturesFinished = true;
                }
            });
        });
    })
};

// load all lectures
this.saveLectures = function() {fs.readFile('./data/fach.json', 'utf8', function (err, data) {
    if (err) {
        return console.log(err);
    }
    console.log("Read \"fach.json\" successfully");
    var lectureArray = JSON.parse(data);
    var expectedCallbacks = lectureArray.length;
    var receivedCallbacks = 0;
    lectureArray.forEach(function (lectureOld) {
        var lectureNew = new lecture(lectureOld);
        var parameter = { props:lectureNew };
        var cypherStatement = "MATCH (lt:LectureType {id:" + lectureOld.fachTyp + "}) CREATE (l:Lecture {props})-[:hasType]->(lt) RETURN l;";
        neo4j.query(cypherStatement, parameter, function(err, result, stats, body) {
            if (stats.nodes_created !== 1 || stats.relationships_created !== 1) {
                throw new Error("Error while creating node. " + JSON.stringify(body));
            }
            console.log("Saved a lecture");
            ++receivedCallbacks;
            if (expectedCallbacks === receivedCallbacks) {
                self.saveTeachings();
            }
        })
    });
})};



this.saveStatus();
this.saveLectureTypes();