const { Sequelize } = require('sequelize');

// Get data from environment variables
const DB_HOST = process.env.DB_HOST;
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    dialect: 'mysql'
});

const connectDB = async () => {
    try {
        // Import all models BEFORE authenticate so Sequelize knows about them
        require('../models');

        await sequelize.authenticate();
        console.log('Connection to MySQL established.');
        await sequelize.sync({ force: process.env.FORCE_DB_SYNC === 'true' }); // Synchronize all models with the database
        console.log('Models synchronized with the database.');
    } catch (error) {
        console.error('Could not connect to database:', error);
        throw error;
    }
};

module.exports = { sequelize, connectDB };

