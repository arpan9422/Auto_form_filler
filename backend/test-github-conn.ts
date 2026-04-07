import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from './src/generated/prisma'; 
const prisma = new PrismaClient(); 
prisma.gitHubConnection.findMany().then(res => {
    console.log("GitHub Connections found: ", res.length);
    if(res.length > 0) {
        console.log("Has valid token: ", res[0].accessToken ? true : false);
        console.log("Scope: ", res[0].scope);
    }
}).catch(console.error).finally(() => prisma.$disconnect());
