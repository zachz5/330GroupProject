-- Update all phone numbers in Customer and Employee tables to (XXX) XXX-XXXX format
-- Run this directly in your MySQL client

-- Update Customer table
UPDATE Customer 
SET phone = CONCAT('(', SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 1, 3), ') ', 
                  SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 4, 3), '-',
                  SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 7, 4))
WHERE phone IS NOT NULL 
  AND LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '')) = 10
  AND phone NOT REGEXP '^\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}$';

-- Handle 11-digit numbers starting with 1 in Customer table
UPDATE Customer 
SET phone = CONCAT('(', SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 2, 3), ') ', 
                  SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 5, 3), '-',
                  SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 8, 4))
WHERE phone IS NOT NULL 
  AND LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '')) = 11
  AND SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 1, 1) = '1'
  AND phone NOT REGEXP '^\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}$';

-- Update Employee table
UPDATE Employee 
SET phone = CONCAT('(', SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 1, 3), ') ', 
                  SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 4, 3), '-',
                  SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 7, 4))
WHERE phone IS NOT NULL 
  AND LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '')) = 10
  AND phone NOT REGEXP '^\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}$';

-- Handle 11-digit numbers starting with 1 in Employee table
UPDATE Employee 
SET phone = CONCAT('(', SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 2, 3), ') ', 
                  SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 5, 3), '-',
                  SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 8, 4))
WHERE phone IS NOT NULL 
  AND LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '')) = 11
  AND SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 1, 1) = '1'
  AND phone NOT REGEXP '^\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}$';


