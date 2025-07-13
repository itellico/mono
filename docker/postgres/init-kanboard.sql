-- Create Kanboard database if it doesn't exist
SELECT 'CREATE DATABASE kanboard'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'kanboard')\gexec

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE kanboard TO developer;