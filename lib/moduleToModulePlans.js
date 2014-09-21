/**
 * @author Tarek Auel
 */
/**
 * Creates a mapping module to module plan object for the new data model
 * @param {object} mapping a json object of the old data model
 * @return {object} a object for neo4j
 */
module.exports = function(mapping) {
    return {
        cypher:
            'MATCH (mp:ModulePlan ' +
            '{id:' + mapping.idModulplan + '}), ' +
            '(m :Module ' +
            '{label: \"' + mapping.modul + '\"}) ' +
            'CREATE (mp)-[:contains]->(m);',
        parameter: {},
        expectedStats: {
            relationships_created: 1,
            contains_updates: true
        }
    };
};
