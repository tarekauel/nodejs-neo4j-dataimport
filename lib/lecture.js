/**
 * @author Tarek Auel
 */
/**
 * Creates a mapping lecture object for the new data model
 * @param {object} lecture a json object of the old data model
 * @return {lecture} a lecture object of the new data model
 */
module.exports = function(lecture) {
    var newLecture = {},
        properties = 0;

    newLecture.id = lecture.idFach;
    ++properties;

    if (lecture.name) {
        ++properties;
        newLecture.title = lecture.name;
    }
    if (lecture.kurzbezeichnung) {
        ++properties;
        newLecture.shortTitle = lecture.kurzbezeichnung;
    }

    return {
        cypher:
            'MATCH (lt:LectureType ' +
            '{id:' + lecture.fachTyp + '}) ' +
            'CREATE (l:Lecture {props})-[:hasType]->(lt) RETURN l;',
        parameter: {
            props: newLecture
        },
        expectedStats: {
            nodes_created: 1,
            properties_set: properties,
            labels_added: 1,
            relationships_created: 1,
            contains_updates: true
        }
    };
};
