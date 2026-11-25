
// const sql = require('mssql/msnodesqlv8');

const dbConfig = {
    server: '127.0.0.1',
    port: 1433, 
    database: 'NPBookstore',
    user: 'npbookstore_user',
    password: 'np.1234',
    options: {trustserverCertificate: true} ,
};

module.exports = dbConfig;

