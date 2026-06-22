import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.payment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.deal.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding users...');
  const salt = await bcrypt.genSalt(10);
  
  const adminHash = await bcrypt.hash('admin123', salt);
  const managerHash = await bcrypt.hash('manager123', salt);
  const salesHash = await bcrypt.hash('sales123', salt);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@crm.com',
      passwordHash: adminHash,
      name: 'Sarah Connor',
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@crm.com',
      passwordHash: managerHash,
      name: 'John Miller',
      role: 'MANAGER',
    },
  });

  const sales1 = await prisma.user.create({
    data: {
      email: 'alice@crm.com',
      passwordHash: salesHash,
      name: 'Alice Johnson',
      role: 'SALES_EXECUTIVE',
    },
  });

  const sales2 = await prisma.user.create({
    data: {
      email: 'bob@crm.com',
      passwordHash: salesHash,
      name: 'Bob Smith',
      role: 'SALES_EXECUTIVE',
    },
  });

  console.log('Seeding customers...');
  const customers = [
    { name: 'Acme Corp', email: 'billing@acme.com', phone: '+1-555-0100', company: 'Acme Corporation', assignedToId: sales1.id },
    { name: 'Globex Corp', email: 'info@globex.com', phone: '+1-555-0200', company: 'Globex Industries', assignedToId: sales1.id },
    { name: 'Initech LLC', email: 'peter@initech.com', phone: '+1-555-0300', company: 'Initech LLC', assignedToId: sales2.id },
    { name: 'Umbrella Corp', email: 'hr@umbrella.com', phone: '+1-555-0400', company: 'Umbrella Pharmaceuticals', assignedToId: sales2.id },
    { name: 'Wayne Enter.', email: 'bruce@wayne.com', phone: '+1-555-0500', company: 'Wayne Enterprises', assignedToId: sales1.id },
  ];

  const dbCustomers = [];
  for (const c of customers) {
    const customer = await prisma.customer.create({ data: c });
    dbCustomers.push(customer);
  }

  console.log('Seeding leads...');
  const leads = [
    { name: 'Thomas Anderson', email: 'neo@matrix.io', phone: '+1-555-0900', company: 'MetaCortex', status: 'NEW', revenue: 12000.0, assignedToId: sales1.id },
    { name: 'Tony Stark', email: 'tony@stark.com', phone: '+1-555-0800', company: 'Stark Industries', status: 'CONTACTED', revenue: 85000.0, assignedToId: sales1.id },
    { name: 'Bruce Banner', email: 'hulk@avengers.org', phone: '+1-555-0700', company: 'Culver University', status: 'QUALIFIED', revenue: 15000.0, assignedToId: sales2.id },
    { name: 'Clark Kent', email: 'clark@dailyplanet.com', phone: '+1-555-0600', company: 'Daily Planet', status: 'CONVERTED', revenue: 5000.0, assignedToId: sales2.id },
    { name: 'Lex Luthor', email: 'lex@lexcorp.com', phone: '+1-555-1212', company: 'LexCorp', status: 'LOST', revenue: 50000.0, assignedToId: sales1.id },
    { name: 'Peter Parker', email: 'spidey@dailybugle.com', phone: '+1-555-2323', company: 'Daily Bugle', status: 'NEW', revenue: 2000.0, assignedToId: sales2.id },
    { name: 'Diana Prince', email: 'diana@museum.org', phone: '+1-555-3434', company: 'Louvre Museum', status: 'QUALIFIED', revenue: 45000.0, assignedToId: sales2.id },
  ];

  const dbLeads = [];
  for (const l of leads) {
    const lead = await prisma.lead.create({ data: l });
    dbLeads.push(lead);
  }

  console.log('Seeding deals...');
  // Clark Kent is converted -> Customer and Deal
  const convertedCustomer = await prisma.customer.create({
    data: {
      name: 'Clark Kent',
      email: 'clark@dailyplanet.com',
      phone: '+1-555-0600',
      company: 'Daily Planet',
      assignedToId: sales2.id,
    },
  });

  const deals = [
    { title: 'Wayne Tech Upgrade', value: 150000.0, stage: 'WON', leadId: null, customerId: dbCustomers[4].id, assignedToId: sales1.id },
    { title: 'Acme Cloud Migration', value: 25000.0, stage: 'PROPOSAL', leadId: null, customerId: dbCustomers[0].id, assignedToId: sales1.id },
    { title: 'Globex Security Audit', value: 45000.0, stage: 'DISCOVERY', leadId: null, customerId: dbCustomers[1].id, assignedToId: sales1.id },
    { title: 'Stark Arc Reactor Consultation', value: 85000.0, stage: 'NEGOTIATION', leadId: dbLeads[1].id, customerId: null, assignedToId: sales1.id },
    { title: 'Daily Planet Ad Campaign', value: 5000.0, stage: 'WON', leadId: dbLeads[3].id, customerId: convertedCustomer.id, assignedToId: sales2.id },
    { title: 'Banner Labs Equipment Lease', value: 15000.0, stage: 'PROPOSAL', leadId: dbLeads[2].id, customerId: null, assignedToId: sales2.id },
    { title: 'Louvre Antiquity Digitization', value: 45000.0, stage: 'PROSPECT', leadId: dbLeads[6].id, customerId: null, assignedToId: sales2.id },
    { title: 'Initech Server Consolidation', value: 12000.0, stage: 'LOST', leadId: null, customerId: dbCustomers[2].id, assignedToId: sales2.id },
  ];

  const dbDeals = [];
  for (const d of deals) {
    const deal = await prisma.deal.create({ data: d });
    dbDeals.push(deal);
  }

  console.log('Seeding activities...');
  const activities = [
    { type: 'CALL', description: 'Called Tony Stark to discuss raw materials. He requested a detailed proposal.', customerId: null, leadId: dbLeads[1].id, userId: sales1.id },
    { type: 'EMAIL', description: 'Sent follow-up email to Bruce Banner with pricing tiers.', customerId: null, leadId: dbLeads[2].id, userId: sales2.id },
    { type: 'MEETING', description: 'Met with Bruce Wayne to finalize contract details. Wayne Tech Upgrade contract signed.', customerId: dbCustomers[4].id, leadId: null, userId: sales1.id },
    { type: 'NOTE', description: 'Clark Kent confirmed Daily Planet approved our marketing proposal. Lead converted.', customerId: convertedCustomer.id, leadId: dbLeads[3].id, userId: sales2.id },
    { type: 'CALL', description: 'Left a voicemail for Thomas Anderson at MetaCortex.', customerId: null, leadId: dbLeads[0].id, userId: sales1.id },
  ];

  for (const a of activities) {
    await prisma.activity.create({ data: a });
  }

  console.log('Seeding tasks...');
  const tasks = [
    { title: 'Send proposal to Tony Stark', description: 'Include estimates for arc reactor upgrade safety systems.', status: 'TODO', dueDate: new Date(Date.now() + 86400000 * 2), assignedToId: sales1.id, customerId: null, leadId: dbLeads[1].id },
    { title: 'Follow up with Lex Luthor', description: 'Check if LexCorp wants to renegotiate terms after rejection.', status: 'COMPLETED', dueDate: new Date(Date.now() - 86400000), assignedToId: sales1.id, customerId: null, leadId: dbLeads[4].id },
    { title: 'Schedule demo with Initech', description: 'Demonstrate our database performance metrics.', status: 'IN_PROGRESS', dueDate: new Date(Date.now() + 86400000 * 5), assignedToId: sales2.id, customerId: dbCustomers[2].id, leadId: null },
    { title: 'Review Wayne Enterprises feedback', description: 'Ensure customer success coordinates training schedules.', status: 'TODO', dueDate: new Date(Date.now() + 86400000 * 1), assignedToId: sales1.id, customerId: dbCustomers[4].id, leadId: null },
    { title: 'Welcome call with Clark Kent', description: 'Onboard Clark Kent as a customer, verify contact details.', status: 'COMPLETED', dueDate: new Date(Date.now() - 86400000 * 3), assignedToId: sales2.id, customerId: convertedCustomer.id, leadId: null },
  ];

  for (const t of tasks) {
    await prisma.task.create({ data: t });
  }

  console.log('Seeding payments...');
  const payments = [
    { amount: 75000.0, status: 'COMPLETED', date: new Date(Date.now() - 86400000 * 10), dealId: dbDeals[0].id, customerId: dbCustomers[4].id },
    { amount: 75000.0, status: 'COMPLETED', date: new Date(Date.now() - 86400000 * 2), dealId: dbDeals[0].id, customerId: dbCustomers[4].id },
    { amount: 5000.0, status: 'COMPLETED', date: new Date(Date.now() - 86400000 * 4), dealId: dbDeals[4].id, customerId: convertedCustomer.id },
  ];

  for (const p of payments) {
    await prisma.payment.create({ data: p });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
