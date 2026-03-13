/**
 * Seed script for S.O.N.E Studios MVP
 *
 * Creates: 1 super admin, 1 tenant, 1 org admin, 2 team members,
 *          5 projects, 10 tasks, 2 sprints, 8 payments
 *
 * Usage: node scripts/seed-data.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });
const mongoose = require('mongoose');

const User = require('../backend/models/User');
const Tenant = require('../backend/models/Tenant');
const Project = require('../backend/models/Project');
const Task = require('../backend/models/Task');
const Sprint = require('../backend/models/Sprint');
const Payment = require('../backend/models/Payment');
const RefreshToken = require('../backend/models/RefreshToken');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI not set. Create backend/.env with your MongoDB connection string.');
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Tenant.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Sprint.deleteMany({}),
    Payment.deleteMany({}),
    RefreshToken.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // Create tenant
  const tenant = await Tenant.create({
    slug: 'sone-demo',
    name: 'S.O.N.E Studios Demo',
    plan: 'professional',
    primaryContact: 'Fortune Mabona',
    primaryEmail: 'admin@sonestudios.com',
    address: 'Johannesburg, South Africa',
    timezone: 'Africa/Johannesburg',
    isActive: true,
  });
  console.log('Created tenant:', tenant.slug);

  // Create super admin
  const superAdmin = await User.create({
    email: 'superadmin@sonestudios.com',
    password: 'SuperAdmin123!',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'SUPER_ADMIN',
    status: 'active',
    tenants: [],
  });
  console.log('Created super admin:', superAdmin.email);

  // Create org admin
  const orgAdmin = await User.create({
    email: 'admin@sonestudios.com',
    password: 'Admin123!',
    firstName: 'Fortune',
    lastName: 'Mabona',
    role: 'ORG_ADMIN',
    status: 'active',
    tenants: [{ tenant: tenant._id, role: 'ORG_ADMIN' }],
  });
  tenant.createdBy = orgAdmin._id;
  await tenant.save();
  console.log('Created org admin:', orgAdmin.email);

  // Create team members
  const pm = await User.create({
    email: 'pm@sonestudios.com',
    password: 'Password123!',
    firstName: 'Thabo',
    lastName: 'Mokoena',
    role: 'PROJECT_MANAGER',
    status: 'active',
    tenants: [{ tenant: tenant._id, role: 'PROJECT_MANAGER' }],
  });

  const member = await User.create({
    email: 'member@sonestudios.com',
    password: 'Password123!',
    firstName: 'Naledi',
    lastName: 'Dlamini',
    role: 'MEMBER',
    status: 'active',
    tenants: [{ tenant: tenant._id, role: 'MEMBER' }],
  });
  console.log('Created team members');

  // Create projects
  const projectsData = [
    {
      name: 'Sandton Office Complex',
      status: 'active',
      contractValue: 25000000,
      expenditureToDate: 8500000,
      contractor: 'BuildRight Construction',
      constructionStatus: 'on_track',
      percentComplete: 34,
      geoTecEngineer: 'Dr. J. van der Merwe',
      geoTecReportStatus: 'submitted',
      ddrStatus: 'complete',
      gpsLatitude: -26.1076,
      gpsLongitude: 28.0567,
      startDate: new Date('2025-06-01'),
      completionDate: new Date('2027-03-31'),
      totalEmployees: 120,
      roePercent: 15,
    },
    {
      name: 'Pretoria Mall Renovation',
      status: 'in_review',
      contractValue: 12000000,
      expenditureToDate: 11200000,
      contractor: 'Apex Builders',
      constructionStatus: 'complete',
      percentComplete: 95,
      geoTecEngineer: 'Prof. A. Nkosi',
      geoTecReportStatus: 'submitted',
      ddrStatus: 'complete',
      gpsLatitude: -25.7479,
      gpsLongitude: 28.2293,
      startDate: new Date('2024-09-01'),
      completionDate: new Date('2026-02-28'),
      totalEmployees: 85,
      roePercent: 22,
    },
    {
      name: 'Durban Beachfront Promenade',
      status: 'active',
      contractValue: 18500000,
      expenditureToDate: 5200000,
      contractor: 'Coastal Works PTY',
      constructionStatus: 'at_risk',
      percentComplete: 28,
      geoTecEngineer: 'Dr. S. Pillay',
      geoTecReportStatus: 'in_review',
      ddrStatus: 'in_review',
      gpsLatitude: -29.8587,
      gpsLongitude: 31.0218,
      startDate: new Date('2025-10-01'),
      completionDate: new Date('2027-09-30'),
      totalEmployees: 95,
      roePercent: 12,
    },
    {
      name: 'Cape Town Waterfront Extension',
      status: 'not_started',
      contractValue: 42000000,
      expenditureToDate: 0,
      contractor: 'Western Cape Developments',
      constructionStatus: 'on_track',
      percentComplete: 0,
      geoTecReportStatus: 'pending',
      ddrStatus: 'pending',
      gpsLatitude: -33.9036,
      gpsLongitude: 18.4203,
      startDate: new Date('2026-07-01'),
      completionDate: new Date('2029-06-30'),
      totalEmployees: 0,
      roePercent: 0,
    },
    {
      name: 'Bloemfontein Community Centre',
      status: 'active',
      contractValue: 6500000,
      expenditureToDate: 3100000,
      contractor: 'Free State Builders',
      constructionStatus: 'delayed',
      percentComplete: 45,
      geoTecEngineer: 'Dr. M. Botha',
      geoTecReportStatus: 'submitted',
      ddrStatus: 'complete',
      gpsLatitude: -29.0852,
      gpsLongitude: 26.1596,
      startDate: new Date('2025-03-01'),
      completionDate: new Date('2026-08-31'),
      challenges: 'Supply chain delays on steel',
      recommendation: 'Source alternative supplier from Gauteng',
      totalEmployees: 45,
      roePercent: 18,
    },
  ];

  const projects = await Promise.all(
    projectsData.map((p) =>
      Project.create({
        ...p,
        tenantId: tenant._id,
        projectManagerId: pm._id,
        createdBy: orgAdmin._id,
        updatedBy: orgAdmin._id,
      })
    )
  );
  console.log(`Created ${projects.length} projects`);

  // Create sprints
  const sprint1 = await Sprint.create({
    tenantId: tenant._id,
    number: 1,
    name: 'Sprint 1 - Foundation',
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-03-14'),
    isActive: false,
  });

  const sprint2 = await Sprint.create({
    tenantId: tenant._id,
    number: 2,
    name: 'Sprint 2 - Structure',
    startDate: new Date('2026-03-15'),
    endDate: new Date('2026-03-28'),
    isActive: true,
  });
  console.log('Created 2 sprints');

  // Create tasks
  const tasksData = [
    { title: 'Complete site survey', status: 'done', priority: 'high', projectId: projects[0]._id, sprintId: sprint1._id },
    { title: 'Review geo-technical report', status: 'in_review', priority: 'critical', projectId: projects[0]._id, sprintId: sprint1._id },
    { title: 'Submit environmental compliance', status: 'in_progress', priority: 'high', projectId: projects[0]._id, sprintId: sprint2._id },
    { title: 'Foundation inspection', status: 'todo', priority: 'medium', projectId: projects[0]._id, sprintId: sprint2._id, dueDate: new Date('2026-03-20') },
    { title: 'Final walkthrough preparation', status: 'in_progress', priority: 'high', projectId: projects[1]._id, sprintId: sprint2._id, dueDate: new Date('2026-03-18') },
    { title: 'Payment certificate processing', status: 'backlog', priority: 'medium', projectId: projects[1]._id },
    { title: 'Coastal erosion assessment', status: 'in_progress', priority: 'critical', projectId: projects[2]._id, sprintId: sprint2._id, dueDate: new Date('2026-03-16') },
    { title: 'Tender document review', status: 'backlog', priority: 'low', projectId: projects[3]._id },
    { title: 'Steel delivery follow-up', status: 'todo', priority: 'high', projectId: projects[4]._id, sprintId: sprint2._id, dueDate: new Date('2026-03-15') },
    { title: 'Update construction timeline', status: 'backlog', priority: 'medium', projectId: projects[4]._id },
  ];

  await Promise.all(
    tasksData.map((t) =>
      Task.create({
        ...t,
        tenantId: tenant._id,
        assignee: Math.random() > 0.5 ? pm._id : member._id,
        createdBy: orgAdmin._id,
        updatedBy: orgAdmin._id,
      })
    )
  );
  console.log(`Created ${tasksData.length} tasks`);

  // Create payments
  const paymentsData = [
    { projectId: projects[0]._id, projectName: projects[0].name, consultantName: 'GeoTech Solutions', invoiceNumber: 'INV-2025-001', paymentDate: new Date('2025-08-15'), paymentAmount: 350000, paymentStatus: 'completed' },
    { projectId: projects[0]._id, projectName: projects[0].name, consultantName: 'BuildRight Construction', invoiceNumber: 'INV-2025-002', paymentDate: new Date('2025-10-01'), paymentAmount: 2500000, paymentStatus: 'completed' },
    { projectId: projects[0]._id, projectName: projects[0].name, consultantName: 'BuildRight Construction', invoiceNumber: 'INV-2026-001', paymentDate: new Date('2026-01-15'), paymentAmount: 3200000, paymentStatus: 'completed' },
    { projectId: projects[1]._id, projectName: projects[1].name, consultantName: 'Apex Builders', invoiceNumber: 'INV-2025-003', paymentDate: new Date('2025-11-20'), paymentAmount: 4500000, paymentStatus: 'completed' },
    { projectId: projects[1]._id, projectName: projects[1].name, consultantName: 'Apex Builders', invoiceNumber: 'INV-2026-002', paymentDate: new Date('2026-02-10'), paymentAmount: 2800000, paymentStatus: 'pending' },
    { projectId: projects[2]._id, projectName: projects[2].name, consultantName: 'Coastal Works PTY', invoiceNumber: 'INV-2026-003', paymentDate: new Date('2026-03-01'), paymentAmount: 1800000, paymentStatus: 'processing' },
    { projectId: projects[4]._id, projectName: projects[4].name, consultantName: 'Free State Builders', invoiceNumber: 'INV-2025-004', paymentDate: new Date('2025-09-30'), paymentAmount: 1200000, paymentStatus: 'completed' },
    { projectId: projects[4]._id, projectName: projects[4].name, consultantName: 'Free State Builders', invoiceNumber: 'INV-2026-004', paymentDate: new Date('2026-02-28'), paymentAmount: 950000, paymentStatus: 'pending' },
  ];

  await Promise.all(
    paymentsData.map((p) =>
      Payment.create({
        ...p,
        tenantId: tenant._id,
      })
    )
  );
  console.log(`Created ${paymentsData.length} payments`);

  console.log('\n--- Seed Complete ---');
  console.log('Super Admin:  superadmin@sonestudios.com / SuperAdmin123!');
  console.log('Org Admin:    admin@sonestudios.com / Admin123!');
  console.log('PM:           pm@sonestudios.com / Password123!');
  console.log('Member:       member@sonestudios.com / Password123!');
  console.log('Tenant slug:  sone-demo');
  console.log('--------------------\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
