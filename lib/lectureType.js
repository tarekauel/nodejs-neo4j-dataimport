/**
 * @author Tarek Auel
 */
/**
 * @param {number} id of the lectureType
 * @return {object} object for creating nodes
 */
module.exports = function(id) {
    return {
        cypher:
            'CREATE (lt:LectureType {props});',
        parameter: {
            props: {
                id: id
            }
        },
        expectedStats: {
            properties_set: 1,
            labels_added: 1,
            nodes_created: 1,
            contains_updates: true
        }
    };
};
