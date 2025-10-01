// const { v4: uuidv4 } = require('uuid');
// const pool = require('../db'); // your PostgreSQL pool

// (async () => {
//   const { faker } = await import('@faker-js/faker'); // dynamic import for CommonJS

//   const BATCH_SIZE = 100; // smaller for testing
//   const TOTAL_PRODUCTS = 1000; // increase later to 100000
//   const seller_id = 'd5aadff4-9029-49b4-8f8d-df115182f380';

//   async function generateProducts() {
//     for (let i = 0; i < TOTAL_PRODUCTS; i += BATCH_SIZE) {
//       const products = [];

//       for (let j = 0; j < BATCH_SIZE && i + j < TOTAL_PRODUCTS; j++) {
//         const id = uuidv4();
//         const title = faker.commerce.productName();
//         const description = faker.commerce.productDescription();
//         const price = parseFloat(faker.commerce.price());
//         const quantity = faker.number.int({ min: 1, max: 100 });
//         const specs = {
//           color: faker.color.human(),
//           weight: faker.number.int({ min: 100, max: 5000 }) + 'g',
//           material: faker.commerce.productMaterial(),
//         };

//         // generate 1-3 image URLs
//         const images = Array.from({ length: faker.number.int({ min: 1, max: 3 }) }).map(
//           () => faker.image.url()
//         );

//         products.push([id, seller_id, title, description, specs, price, quantity, images]);
//       }

//       const query = `
//         INSERT INTO products (id, seller_id, title, description, specs, price, quantity, images)
//         VALUES ${products.map(
//           (_, idx) => `($${idx * 8 + 1}, $${idx * 8 + 2}, $${idx * 8 + 3}, $${idx * 8 + 4}, $${idx * 8 + 5}, $${idx * 8 + 6}, $${idx * 8 + 7}, $${idx * 8 + 8})`
//         ).join(', ')}
//       `;
//       const values = products.flat();
//       await pool.query(query, values);
//       console.log(`Inserted ${Math.min(i + BATCH_SIZE, TOTAL_PRODUCTS)} products`);
//     }
//   }

//   generateProducts()
//     .then(() => {
//       console.log('Finished generating products with faker image URLs');
//       process.exit(0);
//     })
//     .catch(err => {
//       console.error(err);
//       process.exit(1);
//     });
// })();
