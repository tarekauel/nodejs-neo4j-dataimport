/**
 * @author Tarek Auel
 */
/**
 * @param {object} room a json object of the old data model
 * @return {object} a object for neo4j
 */
module.exports = function(room) {
    return {
        cypher: 'CREATE (:Room {props});',
        parameter: {
            props: {
                name: room.raum
            }
        },
        expectedResults: {
            properties_set: 1,
            labels_added: 1,
            nodes_created: 1,
            contains_updates: true
        }
    };
};
