/**
 * @author Tarek Auel
 */
/**
 * Creates a mapping semester object for the new data model
 * @param {object} semester a json object of the old data model
 * @return {object} a semester object of the new data model
 */
module.exports = function(semester) {
    var newSemester = {},
        properties = 0,
        relationships = 0,
        cypherStatement;
    if (semester.startDatum !== '0000-00-00 00:00:00') {
        ++properties;
        newSemester.startDate =
            Date.parse(semester.startDatum);
    }
    if (semester.endDatum !== '0000-00-00 00:00:00') {
        ++properties;
        newSemester.endDate =
            Date.parse(semester.endDatum.replace('00:00:00', '23:59:00'));
    }

    newSemester.semester = semester.semester;
    ++properties;

    cypherStatement = 'MATCH ';

    if (semester.raum && semester.raum !== '') {
        cypherStatement +=
            '(r:Room {name:\'' + semester.raum + '\'}), ';
    }

    cypherStatement +=
        '(c:Course {name:\'' + semester.kurs + '\'}) ' +
        'CREATE (s:Semester {props}), ';

    if (semester.raum && semester.raum !== '') {
        cypherStatement +=
            '(s)-[:hasPreferredRoom]->(r), ';
        relationships++;
    }

    cypherStatement +=
        '(c)-[:has]->(s);';
    relationships++;

    return {
        cypher: cypherStatement,
        parameter: {
            props: newSemester
        },
        expectedStats: {
            nodes_created: 1,
            properties_set: properties,
            labels_added: 1,
            relationships_created: relationships,
            contains_updates: true
        }
    };
};
