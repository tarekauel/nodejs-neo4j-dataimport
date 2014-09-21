/**
 * @author Tarek Auel
 */
/**
 * Creates a mapping module object for the new data model
 * @param {object} module a json object of the old data model
 * @return {module} a module object of the new data model
 */
module.exports = function(module) {
    var newModule = {
        label: module.modul
    };

    return {
        cypher: 'CREATE (m :Module {props})',
        parameter: {
            props: newModule
        },
        expectedStats: {
            properties_set: 1,
            labels_added: 1,
            nodes_created: 1,
            contains_updates: true
        }
    };
};
