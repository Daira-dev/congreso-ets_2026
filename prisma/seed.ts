import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin2026!', 10);
  
  const superAdmin = await prisma.adminUser.upsert({
    where: { usuario: 'superadmin' },
    update: {},
    create: {
      usuario: 'superadmin',
      passwordHash,
      rol: 'SUPER_ADMIN',
    },
  });

  console.log({ superAdmin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
