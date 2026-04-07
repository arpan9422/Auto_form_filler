const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.grwngtxaezdryiigjtoe:6xLWnODXhgwa48R4@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres' });
client.connect().then(() => client.query('SELECT * FROM "GitHubConnection"')).then(res => {
    if (res.rows.length > 0) {
        console.log("Token format:", res.rows[0].accessToken.substring(0, 4));
        console.log("Scope EXACT:", JSON.stringify(res.rows[0].scope));
    }
    client.end();
}).catch(console.error);
