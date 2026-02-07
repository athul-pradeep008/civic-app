const { sequelize, connectDB } = require('./config/database');
const { User, Issue } = require('./models');

const test = async () => {
    try {
        console.log('Testing Database Connection...');
        await connectDB();

        console.log('Creating Test User...');
        const user = await User.create({
            username: 'test_admin_' + Date.now(),
            email: 'test' + Date.now() + '@example.com',
            password: 'password123',
            role: 'admin'
        });
        console.log('✅ User Created:', user.username);

        console.log('Creating Test Issue...');
        const issue = await Issue.create({
            title: 'Test Issue',
            description: 'This is a test issue',
            category: 'other',
            address: '123 Test Lane',
            latitude: 12.9716,
            longitude: 77.5946,
            reporterId: user.id
        });
        console.log('✅ Issue Created:', issue.title);

        console.log('Fetching Issues...');
        const issues = await Issue.findAll({ include: 'reporter' });
        console.log('✅ Issues Found:', issues.length);

        console.log('🎉 VERIFICATION SUCCESSFUL!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification Failed:', error);
        process.exit(1);
    }
};

test();
