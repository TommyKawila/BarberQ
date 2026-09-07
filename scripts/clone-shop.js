#!/usr/bin/env node
/**
 * Clone PHINX STUDIO data to TEST SHOP
 * Usage: node scripts/clone-shop.js
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load env
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🔍 Checking existing shops...');
  
  // Get PHINX shop
  const { data: phinxShop, error: phinxErr } = await supabase
    .from('shops')
    .select('id, name')
    .eq('name', 'PHINX STUDIO')
    .single();
  
  if (phinxErr || !phinxShop) {
    throw new Error('PHINX STUDIO not found');
  }
  
  console.log(`✅ Found PHINX STUDIO: ${phinxShop.id}`);
  
  // Check if TEST SHOP exists
  const { data: existingTest } = await supabase
    .from('shops')
    .select('id, name, status, invite_token')
    .eq('name', 'TEST SHOP')
    .maybeSingle();
  
  let testShop;
  
  if (existingTest) {
    console.log(`⚠️  TEST SHOP already exists: ${existingTest.id}`);
    testShop = existingTest;
  } else {
    // Create TEST SHOP
    console.log('🏗️  Creating TEST SHOP...');
    const { data: createResult, error: createErr } = await supabase.rpc(
      'create_shop_invite',
      {
        p_shop_name: 'TEST SHOP',
        p_subscription_months: 1,
      }
    );
    
    if (createErr) throw new Error(`Failed to create shop: ${createErr.message}`);
    
    const testShopId = createResult.shop_id;
    const inviteToken = createResult.invite_token;
    const base = (env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
    const inviteUrl = `${base}/owner/join?code=${encodeURIComponent(inviteToken)}`;
    
    console.log(`✅ Created TEST SHOP: ${testShopId}`);
    console.log(`📋 Invite URL: ${inviteUrl}`);
    console.log('⚠️  Shop is in PENDING status - claim ownership via invite link');
    
    testShop = { id: testShopId, status: 'pending' };
  }
  
  // Get PHINX barbers
  console.log('\n📋 Fetching PHINX barbers...');
  const { data: phinxBarbers, error: barbersErr } = await supabase
    .from('barbers')
    .select('*')
    .eq('shop_id', phinxShop.id);
  
  if (barbersErr) throw new Error(`Failed to fetch barbers: ${barbersErr.message}`);
  
  console.log(`✅ Found ${phinxBarbers.length} barbers in PHINX`);
  
  // Get existing TEST SHOP barbers
  const { data: existingBarbers } = await supabase
    .from('barbers')
    .select('name, line_id')
    .eq('shop_id', testShop.id);
  
  const existingLineIds = new Set((existingBarbers || []).map(b => b.line_id).filter(Boolean));
  const existingNames = new Set((existingBarbers || []).map(b => b.name));
  
  // Clone barbers to TEST SHOP
  console.log('\n👥 Cloning barbers to TEST SHOP...');
  const barberMap = new Map(); // PHINX barber_id -> TEST barber_id
  
  for (const phinxBarber of phinxBarbers) {
    // Skip if barber with same line_id or name already exists
    if (phinxBarber.line_id && existingLineIds.has(phinxBarber.line_id)) {
      console.log(`⏭️  Skipping ${phinxBarber.name} (line_id already exists)`);
      continue;
    }
    if (existingNames.has(phinxBarber.name)) {
      console.log(`⏭️  Skipping ${phinxBarber.name} (name already exists)`);
      continue;
    }
    
    const { data: newBarber, error: insertErr } = await supabase
      .from('barbers')
      .insert({
        shop_id: testShop.id,
        name: `${phinxBarber.name} (TEST)`, // Add suffix to avoid unique constraint
        line_id: null, // Clear line_id for clones to avoid conflicts
        role: phinxBarber.role === 'owner' ? 'barber' : phinxBarber.role, // Demote owners to barbers
        slot_duration_minutes: phinxBarber.slot_duration_minutes,
        off_days: phinxBarber.off_days,
      })
      .select()
      .single();
    
    if (insertErr) {
      console.error(`❌ Failed to clone ${phinxBarber.name}: ${insertErr.message}`);
      continue;
    }
    
    barberMap.set(phinxBarber.id, newBarber.id);
    console.log(`✅ Cloned ${phinxBarber.name} (${phinxBarber.role} -> barber)`);
  }
  
  // Clone recurring breaks
  console.log('\n🔁 Cloning recurring breaks...');
  for (const [phinxBarberId, testBarberId] of barberMap.entries()) {
    const { data: breaks, error: breaksErr } = await supabase
      .from('recurring_breaks')
      .select('*')
      .eq('barber_id', phinxBarberId);
    
    if (breaksErr) {
      console.error(`❌ Failed to fetch breaks for ${phinxBarberId}: ${breaksErr.message}`);
      continue;
    }
    
    if (!breaks || breaks.length === 0) continue;
    
    const { error: insertErr } = await supabase
      .from('recurring_breaks')
      .insert(
        breaks.map(b => ({
          barber_id: testBarberId,
          weekday: b.weekday,
          start_time: b.start_time,
          end_time: b.end_time,
        }))
      );
    
    if (insertErr) {
      console.error(`❌ Failed to clone breaks: ${insertErr.message}`);
      continue;
    }
    
    console.log(`✅ Cloned ${breaks.length} recurring break(s) for barber ${testBarberId}`);
  }
  
  console.log('\n✨ Done! TEST SHOP setup complete.');
  console.log('\n📌 Next steps:');
  if (testShop.status === 'pending') {
    console.log('1. Claim ownership via invite link (on mobile with LINE)');
    console.log('2. Visit /admin to manage TEST SHOP');
  } else {
    console.log('1. Visit /admin to manage TEST SHOP');
  }
  console.log('\n⚠️  Note: shop_settings (logo, LINE URL, phone) is currently global (not multi-tenant)');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
