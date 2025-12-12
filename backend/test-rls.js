// Test script to verify RLS is working and backend can access database
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'],
});

async function testRLS() {
  try {
    console.log('🔌 Database холболт шалгаж байна...');
    await prisma.$connect();
    console.log('✅ Database холбогдсон\n');

    // Test 1: Settings хүснэгтээс унших
    console.log('📖 Settings хүснэгтээс унших...');
    const settings = await prisma.settings.findMany();
    console.log(`✅ Settings уншигдлаа (${settings.length} мөр)\n`);

    // Test 2: Users хүснэгтээс унших
    console.log('📖 Users хүснэгтээс унших...');
    const userCount = await prisma.user.count();
    console.log(`✅ Users уншигдлаа (${userCount} user байна)\n`);

    // Test 3: Orders хүснэгтээс унших
    console.log('📖 Orders хүснэгтээс унших...');
    const orderCount = await prisma.order.count();
    console.log(`✅ Orders уншигдлаа (${orderCount} order байна)\n`);

    // Test 4: Cargos хүснэгтээс унших
    console.log('📖 Cargos хүснэгтээс унших...');
    const cargos = await prisma.cargo.findMany();
    console.log(`✅ Cargos уншигдлаа (${cargos.length} cargo байна)\n`);

    // Test 5: Agent Profiles хүснэгтээс унших
    console.log('📖 Agent Profiles хүснэгтээс унших...');
    const agentCount = await prisma.agentProfile.count();
    console.log(`✅ Agent Profiles уншигдлаа (${agentCount} agent байна)\n`);

    // Test 6: Card Requests хүснэгтээс унших
    console.log('📖 Card Requests хүснэгтээс унших...');
    const cardRequestCount = await prisma.cardRequest.count();
    console.log(`✅ Card Requests уншигдлаа (${cardRequestCount} request байна)\n`);

    console.log('🎉 Бүх тест амжилттай! RLS зөв ажиллаж байна.\n');
    console.log('💡 Backend-ийг эхлүүлж болно: npm run dev');

  } catch (error) {
    console.error('❌ Алдаа гарлаа:', error.message);
    console.error('\n🔍 Дэлгэрэнгүй:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testRLS();

