
const express = require('express');
const sql = require('mssql');
const dbConfig = require('./dbConfig');

const Joi = require('joi');

const app = express();
const port = 3000;

app.use(express.json());

// LAB 5 ROUTES
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

// LAB 6 BOOK_ROUTES
// GET all books
app.get('/books', async (req, res) => {
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const result = await connection.request().query(
            'SELECT ISBN, Title, YearPublish, PublisherID, BookCat FROM Book'
        );
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) await connection.close();
    }
});

// GET one book by ISBN
app.get('/books/:isbn', async (req, res) => {
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const request = connection.request();
        request.input('isbn', sql.Char(10), req.params.sbn);
        const result = await request.query(
            'SELECT ISBN, Title, YearPublish, BookCat FROM book WHERE ISBN =@isbn'
        );
        if (result.recordset.length == 0) {
            return res.status(404).json({error: 'Not found' });
        }
        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) await connection.close();
    }
});

// POST 
app.post('/books', async (req, res) => {
    const {isbn, title, yearPublish, publisherId, bookCat, authorId} = req.body;
    let connection;
    let transaction;
    try {
        connection = await sql.connect(dbConfig);
        transaction = new sql.Transaction(connection);
        await transaction.begin();

        const bookRequest = transaction.request();
        bookRequest.input('isbn', sql.Char(10),isbn);
        bookRequest.input('title', sql.VarChar(200), title);
        bookRequest.input('yearPublish', sql.Char(4), yearPublish);
        bookRequest.input('publisherId', sql.smallInt, publisherId);
        bookRequest.input('bookCAt', sql.Char(2), bookCat);
        const bookResult = await bookRequest.query(
            'INSERT INTO Book (ISBN, Title, YearPublish, PublisherID, BookCat)' +
            'OUTPUT INSERTED.* VALUES (@isbn, @title, @yearPublish, @publisherId, bookCat'
        );

        await transaction.commit();
        res.status(201).json(bookResult.recordset[0]);
    } catch (err) {
        console.error(err);
        if (transaction) {
            try{
                await transaction.rollback();
            } catch (rollbackErr) {
                console.error(rollbackErr);
            }
        }
        res.status(500).json({ error: 'Database error'});
    } finally {
        if (connection) await connection.close();
    }
});

// LAB 7 BOOK-COPIES
// GET one copy of a book
app.get('/books/:isbn/copies/:copyNo', async (req,res) => {
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const request = connection.request();
        request.input('isbn', sql.Char(10), req.params.isbn);
        request.input('copyNo', sql.TinyInt, req.params.copyNo);
        const result = await request.query(
        'SELECT ISBN, CopyNo, RentalRate, Status FROM BookCopy ' +
        'WHERE ISBN = @isbn AND CopyNo = @copyNo'
    );
        if (result.recordset.length === 0){
            return res.status(404).json({ error: 'Not found' });
        }
        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        if (connection) await connection.close();
    }
})

// PUT: change one copy's rental rate
app.put('/books/:isbn/copies/:copyNo', async (req,res) =>{
    let connection;
    try{
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('isbn', sql.Char(10), req.params.isbn);
    request.input('copyNo', sql.TinyInt, req.params.copyNo);
    request.input('rentalRate', sql.SmallMoney, req.body.rentalRate);
    const result = await request.query(
        'UPDATE BookCopy SET RentalRate = @rentalrate OUTPUT INSERTED.* ' +
        'WHERE ISBN = @isbn AND CopyNo = @copyNo'
    );
    if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ eror: 'Not Found' })
    }
    res.status(200).json(result.recordset[0]);
} catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
} finally {
    if (connection) await connection.close();
}
});

// DELETE one copy of a book
app.delete('/books/:isbn/copies/:copyNo', async (req, res) => {
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const request = connection.request();
        request.input('isbn', sql.Char(10), req.params.isbn);
        request.input('copyNo',sql.TinyInt, req.params.copyNo);
        const result = await request.query(
            'DELETE FROM BookCopy WHERE iSBN =@isbn AND CopyNo = @copyNo'
        );
    if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ eror: 'Not Found' })
    }
    res.status(204).json();
} catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
} finally {
    if (connection) await connection.close();
}
});

// LAB 8 RENT-A-COPY
// Check Helper
 async function checkAvailable(isbn, copyNo){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const result = await connection.request()
        .input('isbn', sql.Char(10), isbn)
        .input('copyNo', sql.TinyInt, copyNo)
        .query('SELECT Status FROM BookCopy WHERE ISBN = @isbn AND CopyNo = @copyNo');
        if (result.recordset.length === 0) return null;
        return result.recordset[0].Status === 'D';
    } finally {
        if (connection) await connection.close();
    }
 }

 // Write Helper
async function markRented(isbn, copyNo){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        await connection.request()
        .input('isbn', sql.Char(10), isbn)
        .input('copyNo', sql.TinyInt, copyNo)
        .query("UPDATE BookCopy SET Status = 'M'  WHERE ISBN = @isbn AND CopyNo = @copyNo");
    } finally {
        if (connection) await connection.close();
    }
 }

 // Rent Route
 app.put('/books/:isbn/copies/:copyNo', async (req,res) =>{
    const isbn = req.params.isbn;
    const copyNo = parseInt(req.params.copyNo);
    try{
        const available = await checkAvailable(isbn, copyNo);
        if (available === null) return res.status(404).json({ error: 'Not found'});
        if (available === false) return res.status(409).json({ error: 'Copy is already rented' });
        await markRented(isbn, copyNo);
        res.status(200).json({ ISBN: isbn, copyNo: copyNo, Status: 'M' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
 });

//  // LAB 9 VALIDATE & RETURN
// // One Schema for the copy
const copySchema = Joi.object({
    isbn: Joi.string().length(10).required(),
    copyNo: Joi.number().integer().min(1).required()
});

// Return Helper
async function markReturned(isbn, copyNo) {
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        await connection.request()
        .input('isbn', sql.Char(10), isbn)
        .input('copyNo', sql.TinyInt, copyNo)
        .query("UPDATE BookCopy SET Status = 'D' WHERE ISBN = @isbn AND CopyNo = @copyNo")
    } finally {
    if (connection) await connection.close();
}
}

// Return Route
app.put('/books/:isbn/copies/:copyNo', async (req,res) =>{
    const {error, value} = copySchema.validate(req.params);
    if (error) return res.status(400).json({ error: error.details[0].message });
    try{
        const available = await checkAvailable(value.isbn, value.copyNo);
        if (available === null) return res.status(404).json({ error: 'Not found'});
        if (available === false) return res.status(409).json({ error: 'Copy is not rented' });
        await markReturned(value.isbn, value.copyNo);
        res.status(200).json({ ISBN: value.isbn, copyNo: value.copyNo, Status: 'D' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
 });

 // LAB 10 SEARCH BOOKS
 app.get('/books', async (req, res) => {
    const {title} = req.query;
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const request = connection.request();
        let query = 'SELECT ISBN, Title, YearPublish, PublisherID, BookCat FROM book';
        if (title) {
            query += "WHERE Title LIKE '&' + @title + '%'";
            request.input('title', sql.VarChar(200), title);
        }
        const result = await request.query(query);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (connection) await connection.close();
    }
});

app.listen(port, () => {
    console.log(`bookcat-api listening on http://localhost:${port}`);
})