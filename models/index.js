const User = require('./User');
const Issue = require('./Issue');
const Vote = require('./Vote');

// Define Associations
User.hasMany(Issue, { foreignKey: 'reporterId', as: 'issuesReported' });
Issue.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });

Issue.hasMany(Vote, { foreignKey: 'issueId', as: 'votes' });
Vote.belongsTo(Issue, { foreignKey: 'issueId' });

User.hasMany(Vote, { foreignKey: 'userId', as: 'userVotes' });
Vote.belongsTo(User, { foreignKey: 'userId' });

// Self-referencing association for duplicates
Issue.belongsTo(Issue, { as: 'duplicateOf', foreignKey: 'duplicateOfId' });
Issue.hasMany(Issue, { as: 'duplicates', foreignKey: 'duplicateOfId' });

module.exports = {
    User,
    Issue,
    Vote
};
