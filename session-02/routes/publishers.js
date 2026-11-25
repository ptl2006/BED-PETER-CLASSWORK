const express = require('express');
const router = express.Router();
router.get('/test', (req, res) => {
    res.send('Publisher router is working!');
});

const sql = require('mssql/msnodesqlv8');
const dbConfig = require('../dbConfig');

// GET all publishers
router.get('/', async (req, res) => {
    // Your original GET all publishers code
});

// GET one publisher by ID
router.get('/:id', async (req, res) => {
    // Your new GET one publisher code
});

// POST a new publisher
console.log('POST publisher route loaded');

// POST a new publisher
router.post('/', async (req, res) => {
    let pool;

    try {
        pool = await sql.connect(dbConfig);

        let result = await pool.request()
            .input('PublisherID', sql.Int, req.body.PublisherID)
.input('Name', sql.VarChar, req.body.Name)
.query(
    'INSERT INTO Publisher (PublisherID, Name) VALUES (@PublisherID, @Name)'
);

        res.status(201).send('Publisher created successfully');
    }
    catch (err) {
        res.status(500).send(err.message);
    }
    finally {
        if (pool) {
            await pool.close();
        }
    }
});
// PUT - Update a publisher
router.put('/:id', async (req, res) => {
    let pool;

    try {
        pool = await sql.connect(dbConfig);

        let result = await pool.request()
            .input('PublisherID', sql.Int, req.params.id)
            .input('Name', sql.VarChar, req.body.Name)
            .query(
                'UPDATE Publisher SET Name = @Name WHERE PublisherID = @PublisherID'
            );

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('Publisher not found');
        }

        res.status(200).send('Publisher updated successfully');
    }
    catch (err) {
        res.status(500).send(err.message);
    }
    finally {
        if (pool) {
            await pool.close();
        }
    }
});
// DELETE - Delete a publisher
router.delete('/:id', async (req, res) => {
    let pool;

    try {
        pool = await sql.connect(dbConfig);

        let result = await pool.request()
            .input('PublisherID', sql.Int, req.params.id)
            .query(
                'DELETE FROM Publisher WHERE PublisherID = @PublisherID'
            );

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('Publisher not found');
        }

        res.status(204).send();
    }
    catch (err) {
        res.status(500).send(err.message);
    }
    finally {
        if (pool) {
            await pool.close();
        }
    }
});
module.exports = router;