const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

// Create MySQL connection
const connection = mysql.createConnection({
 host: 'localhost',
 user: 'root',
 password: 'Iisssfamily',
 database: 'c237_supermarketapp'
});
connection.connect((err) => {
 if (err) {
 console.error('Error connecting to MySQL:', err);
 return;
 }
 console.log('Connected to MySQL database');
});
// Set up view engine
app.set('view engine', 'ejs');
// enable static files
app.use(express.static('public'));

app.use(express.urlencoded({
    extended: true 
}));
app.get('/', (req, res) => {
    // Example: Fetch all products to display on the home page
    connection.query('SELECT * FROM products', (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.send('Error retrieving products');
        }
        // Assuming you have an 'index.ejs' file in your views folder
        res.render('index', { products: results });
    });
});

app.get('/product/:id', (req, res) => {
    // Extract the product ID from the request parameters
    const productId = req.params.id;
    const sql = 'SELECT * FROM products WHERE productId = ?';
    // Fetch data from MySQL based on the product ID
    connection.query( sql , [productId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.send('Error Retrieving product by ID');
        }
        // Check if any product with the given ID was found
        if (results.length > 0) {
            // Render HTML page with the product data
            res.render('product', { product: results[0] });
        } else {
            // If no product with the given ID was found
            res.send('Product not found');
        }
    });
});

app.get('/addProduct', (req, res) => {
    res.render('addProduct');
});

app.post('/addProduct', upload.single('image'), (req, res) => {
    // 1. Extract data matching your HTML attributes: name="name", name="quantity", name="price"
    const { name, quantity, price } = req.body;
    
    // 2. Handle image selection (with a fallback placeholder if they don't upload one)
    let image = 'default.png'; // Change this to 'placeholder.png' or whatever your lab sheet uses
    if (req.file) {
        image = req.file.filename; // Saves the uploaded filename just like your edit route
    }

    // 3. SQL query mapping your variables to the database columns
    const sql = 'INSERT INTO products (productName, quantity, price, image) VALUES (?, ?, ?, ?)';
    
    connection.query(sql, [name, quantity, price, image], (error, results) => {
        if (error) {
            console.error("Error adding product:", error);
            return res.send('Error adding product');
        } else {
            // Success! Go back to the product list view
            res.redirect('/');
        }
    });
});

app.get('/editProduct/:id', (req, res) => {
    const productId = req.params.id;
    
    // Use SELECT instead of UPDATE to get the current product data
    const sql = 'SELECT * FROM products WHERE productId = ?';
    
    connection.query(sql, [productId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.send('Error retrieving product by ID');
        }
        
        // If the product exists, render the edit page and pass the data
        if (results.length > 0) {
            res.render('editProduct', { product: results[0] });
        } else {
            res.send('Product not found');
        }
    });
});

app.post('/editProduct/:id', upload.single('image'), (req, res) => {
    const productId = req.params.id;
    
    // 1. Extract product data from the request body
    // Multer populates req.body for the text fields and req.file for the file
    const { name, quantity, price, currentImage } = req.body;
    
    // 2. Handle the image update logic
    let image = currentImage; // Default to the existing image if no new file is uploaded
    if (req.file) {
        image = req.file.filename; // If a new image is uploaded, use the new filename
    }

    // 3. Update the SQL query to include the image column
    const sql = 'UPDATE products SET productName = ?, quantity = ?, price = ?, image = ? WHERE productId = ?';
    
    // 4. Execute the query
    connection.query(sql, [name, quantity, price, image, productId], (error, results) => {
        if (error) {
            console.error("Error updating product:", error);
            res.send('Error updating product');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});

app.get('/deleteProduct/:id', (req, res) => {
    const productId = req.params.id;
    const sql = 'DELETE FROM products WHERE productId = ?';
    connection.query( sql , [productId], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error deleting product:", error);
            res.send('Error deleting product');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));