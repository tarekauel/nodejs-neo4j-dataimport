/**
 * @author Tarek Auel
 */
/**
 * Creates a mapping user object for the new data model
 * @param {object} user a json object of the old data model
 * @return {user} a user object of the new data model
 */
module.exports = function(user) {
    return {
        userName: user.user_name
    };
};
