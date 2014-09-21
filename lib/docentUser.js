/**
 * @author Tarek Auel
 */
/**
 * @param {object} mapping a json object of the old data model
 * @return {object} a object for neo4j
 */
module.exports = function(mapping) {
    return {
        cypher:
            cypherStatement =
                'MATCH (d:Docent {id:' + mapping.idDozent + '}) ' +
                'SET d.userName = \'' + mapping.user_name + '\', ' +
                'd:User;',
        parameter: {},
        expectedStats: {
            properties_set: 1,
            labels_added: 1,
            contains_updates: true
        }
    };
};
