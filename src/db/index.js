import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

export const connectDB = async () => {
    try {
        console.log('Connecting to MongoDB...');
        console.log('DB_NAME: ', DB_NAME);
        console.log('URI: ', `${process.env.MONGO_URI}/${DB_NAME}`);
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`,);
        console.log('MongoDB connected HOST: ', connectionInstance.connection.host);
    } catch (error) {
        console.log('Connection Failed: ', error);
        console.error(error);
        process.exit(1);
    }
};