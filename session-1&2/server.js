
const express = require('express');
const sql = require('mssql');
const dbConfig = require('./dbConfig');

const app = express();

app.use(express.json());

// Import Publisher routes
const publisherRoutes = require('./routes/publishers');

// Use Publisher routes
app.use('/publishers', publisherRoutes);

app.get('/', async(req, res) => {
    res.send('Bookcat API is running!');
});

app.get('/db-test', async (req, res) => {
    
   try {
        let pool = await sql.connect(dbConfig);
        const result = await pool.request()
        .query('SELECT COUNT(*) AS Total FROM Author');
        await pool.close();
        res.json({connected: true, authors: result.recordset[0].Total});
    }
    catch (err) {
        console.log(err);
    }  
    
    
    // res.send('Bookcat API is running!');
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

