require('dotenv').config();
const knex = require('../knex');

async function migrate() {
  // Users table
  await knex.schema.createTableIfNotExists('users', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Transactions table
  await knex.schema.createTableIfNotExists('transactions', (table) => {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('description').notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.string('type').notNullable();
    table.string('category').defaultTo('General');
    table.timestamp('date').defaultTo(knex.fn.now());
  });

  // Bills table
  await knex.schema.createTableIfNotExists('bills', (table) => {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('name').notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.string('frequency').defaultTo('monthly');
    table.date('due_date').notNullable();
    table.boolean('auto_pay').defaultTo(false);
    table.string('status').defaultTo('pending');
  });

  // Budgets table
  await knex.schema.createTableIfNotExists('budgets', (table) => {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('category').notNullable();
    table.decimal('limit_amount', 10, 2).notNullable();
    table.decimal('spent_amount', 10, 2).defaultTo(0);
  });

  console.log('✅ Saari tables ban gayi!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration fail:', err.message);
  process.exit(1);
});