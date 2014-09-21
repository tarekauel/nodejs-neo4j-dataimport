/**
 * @author Tarek Auel
 */
/**
 * @param {object} teaches object of teaching information
 * @return {object} object for creating nodes
 */
module.exports = function(teaches) {
    return {
        cypher:
            'MATCH (d:Docent ' +
            '{id:' + teaches.idDozent + '}), ' +
            '(l:Lecture ' +
            '{id:' + teaches.idFach + '}) ' +
            'CREATE (d)-[:teaches]->(l) RETURN d,l;',
        parameter: {},
        expectedStats: {
            relationships_created: 1,
            contains_updates: true
        }
    };
};
