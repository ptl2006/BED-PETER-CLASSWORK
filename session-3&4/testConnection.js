
const sql = require('mssql/msnodesqlv8');
const dbConfig = require('./dbConfig');

async function testConnection() {
    try {
        let pool = await sql.connect(dbConfig);

        console.log('Connected to NPBookstore successfully!');

        await pool.close();
    }
    catch (err) {
        console.log('Connection failed!');
        console.log(err.message);
    }
}

testConnection();
