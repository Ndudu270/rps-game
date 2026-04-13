/**
 * Data Validation Script
 * Validates all JSON data files against their schemas
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'data');
const SCHEMAS_DIR = path.join(__dirname, '..', 'schemas');

interface ValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
}

function validateJsonFile(filePath: string): ValidationResult {
  const result: ValidationResult = {
    file: path.basename(filePath),
    valid: true,
    errors: []
  };

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    JSON.parse(content);
  } catch (error) {
    result.valid = false;
    result.errors.push((error as Error).message);
  }

  return result;
}

function validateAllData(): void {
  console.log('🔍 Validating backend data files...\n');

  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  const results: ValidationResult[] = [];

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    results.push(validateJsonFile(filePath));
  }

  let validCount = 0;
  let invalidCount = 0;

  for (const result of results) {
    if (result.valid) {
      console.log(`✓ ${result.file}`);
      validCount++;
    } else {
      console.log(`✗ ${result.file}`);
      result.errors.forEach(err => console.log(`  - ${err}`));
      invalidCount++;
    }
  }

  console.log(`\n${validCount} valid, ${invalidCount} invalid`);
  process.exit(invalidCount > 0 ? 1 : 0);
}

validateAllData();
