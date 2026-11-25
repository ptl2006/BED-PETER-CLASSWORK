
const express = require('express');

const app = express();

app.use(express.json());

// Import Publisher routes
const publisherRoutes = require('./routes/publishers');

// Use Publisher routes
app.use('/publishers', publisherRoutes);

app.get('/', (req, res) => {
    res.send('Bookcat API is running!');
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

