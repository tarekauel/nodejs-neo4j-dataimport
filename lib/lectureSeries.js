/**
 * @author Tarek Auel
 */
/**
 * Creates a mapping lecture series object for the new data model
 * @param {object} lectureSeries a json object of the old data model
 * @return {object} a lectureSeries object of the new data model
 */
module.exports = function(lectureSeries) {
    var newLectureSeries = {},
        relationships = 0,
        cypherStatement,
        associations;

    newLectureSeries.id = lectureSeries.idVorlesung;

    cypherStatement = 'MATCH ';
    associations = '(l)<-[:isSeriesOf]-(ls), ';

    if (lectureSeries.idDozent !== 0) {
        cypherStatement += '(d:Docent {id:' + lectureSeries.idDozent + '}), ';
        associations += '(d)-[:lectures]->(ls), ';
        ++relationships;
    }

    if (lectureSeries.raum !== '') {
        cypherStatement += '(r:Room {name:\'' + lectureSeries.raum + '\'}), ';
        associations += '(ls)-[:uses]->(r), ';
        ++relationships;
    }

    cypherStatement +=
        '(l:Lecture {id:' + lectureSeries.idFach + '}), ' +
        '(c:Course {name:\'' + lectureSeries.kurs + '\'})' +
        '-[:has]->(s:Semester {semester:' + lectureSeries.semester + '}) ';
    ++relationships;

    associations +=
        '(s)-[:contains]->(ls);';
    ++relationships;

    cypherStatement +=
        'CREATE (ls:LectureSeries {ls}), ' +
        associations;

    return {
        cypher: cypherStatement,
        parameter: {
            ls: newLectureSeries
        },
        expectedStats: {
            relationships_created: relationships,
            properties_set: 1,
            nodes_created: 1,
            contains_updates: true,
            labels_added: 1
        }
    };
};
