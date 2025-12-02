-- Create furniture table
CREATE TABLE IF NOT EXISTS furniture (
    furniture_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    condition_status ENUM('New', 'Like New', 'Good', 'Fair', 'Poor') DEFAULT 'Good',
    quantity INT DEFAULT 0,
    image_url VARCHAR(500),
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    added_by_employee_id INT,
    FOREIGN KEY (added_by_employee_id) REFERENCES employee(employee_id) ON DELETE SET NULL
);


