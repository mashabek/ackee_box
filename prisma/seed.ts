import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

// Seed the database with boxes from CSV file
async function main() {
  // Check if boxes are already seeded
  const count = await prisma.box.count();
  if (count > 0) {
    console.log('Boxes already seeded, skipping.');
    return;
  }

  // Read and parse the CSV file
  const csvPath = path.join(__dirname, '../boxes.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const values = batch.map((row: { identifier: any; lon: string; lat: string; }) =>
      `('${row.identifier}', '${row.identifier}', '', '', ST_SetSRID(ST_MakePoint(${parseFloat(row.lon)}, ${parseFloat(row.lat)}), 4326)::geography, NULL)`
    ).join(',');

    await prisma.$executeRawUnsafe(`
      INSERT INTO "Box" (id, code, name, address, location, status)
      VALUES ${values}
      ON CONFLICT (id) DO NOTHING;
    `);
  }
  console.log(`Seeded ${records.length} boxes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 