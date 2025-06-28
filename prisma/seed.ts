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

  console.log(`Found ${records.length} boxes to seed`);

  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    
    for (const row of batch) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "Box" (id, code, name, address, location, status, created_at)
          VALUES (
            ${row.identifier}, 
            ${row.identifier}, 
            ${'Box ' + row.identifier}, 
            ${'Address for ' + row.identifier}, 
            ST_SetSRID(ST_MakePoint(${parseFloat(row.lon)}, ${parseFloat(row.lat)}), 4326)::geography, 
            'active',
            NOW()
          )
          ON CONFLICT (id) DO NOTHING;
        `;
      } catch (error) {
        console.error(`Error inserting box ${row.identifier}:`, error);
      }
    }
    
    console.log(`Seeded batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(records.length / BATCH_SIZE)}`);
  }
  
  console.log(`Seeded ${records.length} boxes.`);
  
  // Create sample compartments for first 20 boxes with balanced size distribution
  console.log('Creating sample compartments...');
  const sampleBoxes = await prisma.box.findMany({ take: 20 });
  const compartmentSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  
  for (const box of sampleBoxes) {
    // Create 10 compartments per box with balanced size distribution
    for (let i = 1; i <= 10; i++) {
      const size = compartmentSizes[(i - 1) % compartmentSizes.length];
      await prisma.$executeRaw`
        INSERT INTO compartments (box_id, compartment_number, size, status, created_at)
        VALUES (${box.id}, ${i}, ${size}, 'available', NOW())
        ON CONFLICT (box_id, compartment_number) DO NOTHING;
      `;
    }
  }
  
  console.log(`Created compartments for ${sampleBoxes.length} boxes.`);
  
  // Create sample orders with different package sizes
  console.log('Creating sample orders...');
  const sampleOrders = [
    { externalOrderId: 'EXT-2024-001', customerId: 'customer-123', packageSize: 'M' },
    { externalOrderId: 'EXT-2024-002', customerId: 'customer-456', packageSize: 'L' },
    { externalOrderId: 'EXT-2024-003', customerId: 'customer-789', packageSize: 'S' },
    { externalOrderId: 'EXT-2024-004', customerId: 'customer-abc', packageSize: 'XL' },
    { externalOrderId: 'EXT-2024-005', customerId: 'customer-def', packageSize: 'XXL' }
  ];
  
  for (const order of sampleOrders) {
    await prisma.$executeRaw`
      INSERT INTO orders (external_order_id, customer_id, package_size, status, created_at)
      VALUES (${order.externalOrderId}, ${order.customerId}, ${order.packageSize}, 'pending', NOW())
      ON CONFLICT (external_order_id) DO NOTHING;
    `;
  }
  
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 