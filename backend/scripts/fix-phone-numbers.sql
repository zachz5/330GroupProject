-- Script to standardize all phone numbers to (XXX) XXX-XXXX format
-- Run this directly in your MySQL client

-- Function to normalize phone (MySQL doesn't support regex replace easily, so we'll use a stored procedure approach)
-- For now, we'll do manual updates for common formats

-- Update Customer table phone numbers
-- Format: (555) 111-2222 -> keep as is if already formatted
-- Format: 555-111-2222 -> convert to (555) 111-2222
-- Format: 5551112222 -> convert to (555) 111-2222
-- Format: 15551112222 -> convert to (555) 111-2222

UPDATE Customer 
SET phone = CONCAT('(', SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 1, 3), ') ', 
                  SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 4, 3), '-',
                  SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 7, 4))
WHERE phone IS NOT NULL 
  AND LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '')) = 10
  AND phone NOT REGEXP '^\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}$';

-- Handle 11-digit numbers starting with 1
UPDATE Customer 
SET phone = CONCAT('(', SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 2, 3), ') ', 
                  SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 5, 3), '-',
                  SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 8, 4))
WHERE phone IS NOT NULL 
  AND LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '')) = 11
  AND SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 1, 1) = '1'
  AND phone NOT REGEXP '^\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}$';

-- Update Employee table phone numbers (same logic)
UPDATE Employee 
SET phone = CONCAT('(', SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 1, 3), ') ', 
                  SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 4, 3), '-',
                  SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 7, 4))
WHERE phone IS NOT NULL 
  AND LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '')) = 10
  AND phone NOT REGEXP '^\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}$';

UPDATE Employee 
SET phone = CONCAT('(', SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 2, 3), ') ', 
                  SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 5, 3), '-',
                  SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 8, 4))
WHERE phone IS NOT NULL 
  AND LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '')) = 11
  AND SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 1, 1) = '1'
  AND phone NOT REGEXP '^\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}$';






