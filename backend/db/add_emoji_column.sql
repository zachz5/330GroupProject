-- Add emoji column to Furniture table
-- Run this SQL directly in your database when you have available connections

ALTER TABLE Furniture 
ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) NULL AFTER image_url;


