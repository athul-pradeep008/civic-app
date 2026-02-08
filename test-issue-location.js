const { sequelize, connectDB } = require('./config/database');
const { Issue } = require('./models');

const test = async () => {
    try {
        await connectDB();

        console.log('Fetching last issue...');
        const issue = await Issue.findOne({
            order: [['createdAt', 'DESC']]
        });

        if (!issue) {
            console.log('No issues found to test.');
            process.exit(0);
        }

        console.log('Checking "location" virtual field...');
        const location = issue.location; // Should trigger the getter

        if (location && location.type === 'Point' && Array.isArray(location.coordinates)) {
            console.log('✅ Success! user.location:', JSON.stringify(location));
            console.log('   Coordinates:', location.coordinates);
            process.exit(0);
        } else {
            console.error('❌ Failed! location field is missing or invalid:', location);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Error during verification:', error);
        process.exit(1);
    }
};

test();
