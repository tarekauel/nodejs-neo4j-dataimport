/**
 * @author Tarek Auel
 */
/**
 * Creates a mapping module plan object for the new data model
 * @param {object} oldPlan a json object of the old data model
 * @return {modulePlan} a module plan object of the new data model
 */
module.exports = function modulePlan(oldPlan) {
    var newModulePlan;

    newModulePlan = {
        id: oldPlan.idModulplan,
        name: oldPlan.name,
        specialisation: oldPlan.vertiefungsrichtung
    };

    return {
        cypher: 'CREATE (:ModulePlan {props});',
        parameter: {
            props: newModulePlan
        },
        expectedStats: {
            properties_set: 3,
            labels_added: 1,
            nodes_created: 1,
            contains_updates: true
        }
    };
};
