/**
 * @author Tarek Auel
 */
/**
 * Creates a mapping module to lectures object for the new data model
 * @param {object} mapping a json object of the old data model
 * @return {object} a object for neo4j
 */
module.exports = function(mapping) {

    return {
        cypher:
            'MATCH (l:Lecture ' +
            '{id: ' + mapping.idfach + '}), ' +
            '(m:Module ' +
            '{label:\"' + mapping.modul + '\"}) ' +
            'CREATE (m)-[:includes {props}]->(l);',
        parameter: {
            props: {
                semester: mapping.semester,
                numOfHours: mapping.stunden
            }
        },
        expectedStats: {
            properties_set: 2,
            relationships_created: 1,
            contains_updates: true
        }
    };
};
