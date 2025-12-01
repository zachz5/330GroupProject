-- Add an employee to the employee table
-- Replace the values with actual employee information

INSERT INTO employee (first_name, last_name, email, phone, role, hire_date)
VALUES (
    'John',           -- First name
    'Doe',            -- Last name
    'john.doe@university.edu',  -- Email (must match customer email if they have an account)
    '(555) 123-4567', -- Phone (optional)
    'Manager',         -- Role
    CURDATE()         -- Hire date (uses current date)
);

-- Note: If the employee already has a customer account with this email,
-- they will automatically get employee privileges when they log in.

