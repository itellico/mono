#!/usr/bin/env php
<?php
/**
 * Migrate Kanboard data from SQLite to PostgreSQL
 * 
 * This script:
 * 1. Connects to both SQLite and PostgreSQL databases
 * 2. Reads all data from SQLite
 * 3. Transfers it to PostgreSQL with proper sequences
 * 4. Preserves all relationships and IDs
 */

echo "=== Kanboard SQLite to PostgreSQL Migration ===\n\n";

// Configuration
$sqliteFile = '/Users/mm2/dev_mm/mono/php/kanboard/data/db.sqlite';

// Check if running inside Docker container
if (file_exists('/.dockerenv')) {
    // Inside container - use Docker service names
    $pgHost = 'postgres';
} else {
    // Outside container - use localhost
    $pgHost = 'localhost';
}

$pgPort = 5432;
$pgDb = 'kanboard';
$pgUser = 'developer';
$pgPass = 'developer';

// Check if SQLite file exists
if (!file_exists($sqliteFile)) {
    die("ERROR: SQLite database not found at: $sqliteFile\n");
}

echo "Connecting to SQLite database...\n";
try {
    $sqlite = new PDO("sqlite:$sqliteFile");
    $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("ERROR: Cannot connect to SQLite: " . $e->getMessage() . "\n");
}

echo "Connecting to PostgreSQL database...\n";
try {
    $pgsql = new PDO("pgsql:host=$pgHost;port=$pgPort;dbname=$pgDb", $pgUser, $pgPass);
    $pgsql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("ERROR: Cannot connect to PostgreSQL: " . $e->getMessage() . "\n");
}

// Get all tables from SQLite
echo "\nFetching table list from SQLite...\n";
$tables = [];
$result = $sqlite->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    $tables[] = $row['name'];
}
echo "Found " . count($tables) . " tables to migrate\n";

// Start migration
$pgsql->beginTransaction();

try {
    // Disable foreign key checks temporarily
    $pgsql->exec("SET session_replication_role = 'replica'");
    
    // Clear all existing data
    echo "\nClearing existing PostgreSQL data...\n";
    foreach (array_reverse($tables) as $table) {
        $pgsql->exec("TRUNCATE TABLE \"$table\" CASCADE");
    }
    
    // Migrate each table
    foreach ($tables as $table) {
        echo "\nMigrating table: $table\n";
        
        // Get column info
        $columns = [];
        $result = $sqlite->query("PRAGMA table_info($table)");
        while ($col = $result->fetch(PDO::FETCH_ASSOC)) {
            $columns[] = $col['name'];
        }
        
        // Count records
        $count = $sqlite->query("SELECT COUNT(*) FROM $table")->fetchColumn();
        echo "  - Records to migrate: $count\n";
        
        if ($count > 0) {
            // Special handling for project_has_users table
            if ($table === 'project_has_users') {
                $data = $sqlite->query("SELECT * FROM $table")->fetchAll(PDO::FETCH_ASSOC);
                $stmt = $pgsql->prepare("INSERT INTO \"project_has_users\" (\"project_id\", \"user_id\", \"role\") VALUES (?, ?, ?)");
                
                $inserted = 0;
                foreach ($data as $row) {
                    // Convert is_owner to role
                    $role = ($row['is_owner'] == 1) ? 'project-manager' : 'project-member';
                    $stmt->execute([$row['project_id'], $row['user_id'], $role]);
                    $inserted++;
                }
                echo "  - Inserted: $inserted/$count - Complete (converted is_owner to role)\n";
            } else {
                // Fetch all data from SQLite
                $data = $sqlite->query("SELECT * FROM $table")->fetchAll(PDO::FETCH_ASSOC);
                
                // Get PostgreSQL columns
                $pgColumns = [];
                $result = $pgsql->query("SELECT column_name FROM information_schema.columns WHERE table_name = '$table' AND table_schema = 'public'");
                while ($col = $result->fetch(PDO::FETCH_ASSOC)) {
                    $pgColumns[] = $col['column_name'];
                }
                
                // Only insert columns that exist in PostgreSQL
                $commonColumns = array_intersect($columns, $pgColumns);
                
                if (count($commonColumns) > 0) {
                    $placeholders = array_fill(0, count($commonColumns), '?');
                    $sql = "INSERT INTO \"$table\" (\"" . implode('", "', $commonColumns) . "\") VALUES (" . implode(', ', $placeholders) . ")";
                    $stmt = $pgsql->prepare($sql);
                    
                    $inserted = 0;
                    foreach ($data as $row) {
                        $values = [];
                        foreach ($commonColumns as $col) {
                            $values[] = $row[$col] ?? null;
                        }
                        $stmt->execute($values);
                        $inserted++;
                        
                        if ($inserted % 100 == 0) {
                            echo "  - Inserted: $inserted/$count\r";
                        }
                    }
                    echo "  - Inserted: $inserted/$count - Complete\n";
                }
            }
        }
    }
    
    // Re-enable foreign key checks
    $pgsql->exec("SET session_replication_role = 'origin'");
    
    // Update sequences
    echo "\nUpdating PostgreSQL sequences...\n";
    $sequences = $pgsql->query("
        SELECT 
            tc.table_name, 
            kcu.column_name,
            pg_get_serial_sequence(tc.table_schema||'.'||tc.table_name, kcu.column_name) as sequence_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
        AND pg_get_serial_sequence(tc.table_schema||'.'||tc.table_name, kcu.column_name) IS NOT NULL
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($sequences as $seq) {
        $maxId = $pgsql->query("SELECT COALESCE(MAX(\"{$seq['column_name']}\"), 0) FROM \"{$seq['table_name']}\"")->fetchColumn();
        if ($maxId > 0) {
            $pgsql->exec("SELECT setval('{$seq['sequence_name']}', $maxId)");
            echo "  - Updated sequence for {$seq['table_name']}.{$seq['column_name']} to $maxId\n";
        }
    }
    
    // Commit transaction
    $pgsql->commit();
    
    echo "\n✅ Migration completed successfully!\n\n";
    
    // Show summary
    echo "Migration Summary:\n";
    foreach ($tables as $table) {
        $count = $pgsql->query("SELECT COUNT(*) FROM \"$table\"")->fetchColumn();
        if ($count > 0) {
            echo "  - $table: $count records\n";
        }
    }
    
} catch (Exception $e) {
    $pgsql->rollBack();
    die("\n❌ ERROR during migration: " . $e->getMessage() . "\n");
}

echo "\n🎉 All done! Kanboard data has been migrated to PostgreSQL.\n";
echo "Don't forget to restart your containers to use the new database!\n";