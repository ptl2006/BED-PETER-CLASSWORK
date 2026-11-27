
// const sql = require('mssql/msnodesqlv8');

const dbConfig = {
    
    server: 'localhost',
    port: 1434, 
    database: 'NPBookstore',
    user: 'npbookstore_user',
    password: 'Np@1234',
    options: {
        trustServerCertificate: true
    } ,
};

module.exports = dbConfig;

