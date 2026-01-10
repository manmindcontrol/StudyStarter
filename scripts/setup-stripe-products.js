/**
 * Automatický skript na vytvorenie Stripe produktov a cien
 * Spusti: node scripts/setup-stripe-products.js
 *
 * Tento skript vytvorí:
 * - PDF Conversion (jednorázová platba 0.50€)
 * - Basic Plan (mesačné predplatné 4.99€)
 * - Premium Plan (mesačné predplatné 9.99€)
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

// Kontrola prítomnosti API kľúča
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ CHYBA: STRIPE_SECRET_KEY nie je nastavený v .env.local');
  console.log('\n📝 Postupuj podľa STRIPE_SETUP.md na získanie API kľúčov');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

// Produkty a ceny na vytvorenie
const products = [
  {
    name: 'PDF Conversion',
    description: 'Convert PDF to DOCX - One-time payment',
    type: 'one_time',
    price: 0.50,
    currency: 'eur',
    envVar: 'STRIPE_PRICE_PDF_CONVERSION',
  },
  {
    name: 'Basic Plan',
    description: '20 PDF conversions/month, 10 materials, AI features',
    type: 'recurring',
    price: 4.99,
    currency: 'eur',
    interval: 'month',
    envVar: 'STRIPE_PRICE_BASIC',
  },
  {
    name: 'Premium Plan',
    description: 'Unlimited access to all features',
    type: 'recurring',
    price: 9.99,
    currency: 'eur',
    interval: 'month',
    envVar: 'STRIPE_PRICE_PREMIUM',
  },
];

async function createProducts() {
  console.log('🚀 Začínam vytvárať Stripe produkty...\n');

  const envVars = [];

  for (const product of products) {
    try {
      console.log(`📦 Vytváram produkt: ${product.name}`);

      // Vytvor produkt
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
      });

      console.log(`   ✅ Produkt vytvorený: ${stripeProduct.id}`);

      // Vytvor cenu
      const priceData = {
        product: stripeProduct.id,
        currency: product.currency,
        unit_amount: Math.round(product.price * 100), // Stripe používa centy
      };

      if (product.type === 'recurring') {
        priceData.recurring = {
          interval: product.interval,
        };
      }

      const stripePrice = await stripe.prices.create(priceData);

      console.log(`   💰 Cena vytvorená: ${stripePrice.id}`);
      console.log(`   💵 Suma: ${product.price} ${product.currency.toUpperCase()}`);

      if (product.type === 'recurring') {
        console.log(`   🔄 Typ: Recurring (${product.interval}ly)`);
      } else {
        console.log(`   🔄 Typ: One-time payment`);
      }

      envVars.push(`${product.envVar}=${stripePrice.id}`);
      console.log('');
    } catch (error) {
      console.error(`   ❌ Chyba pri vytváraní ${product.name}:`, error.message);
      console.log('');
    }
  }

  // Vypíš environment variables
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ Produkty úspešne vytvorené!');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📝 Pridaj tieto riadky do svojho .env.local súboru:\n');
  console.log('# Stripe Price IDs');
  envVars.forEach(envVar => {
    console.log(envVar);
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📋 Ďalší krok: Aktualizuj databázu');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Vygeneruj SQL na aktualizáciu subscription_tiers tabuľky
  const basicPriceId = envVars.find(v => v.includes('BASIC')).split('=')[1];
  const premiumPriceId = envVars.find(v => v.includes('PREMIUM')).split('=')[1];

  console.log('Spusti tento SQL v Supabase SQL Editore:\n');
  console.log(`UPDATE public.subscription_tiers SET stripe_price_id = '${basicPriceId}' WHERE id = 'basic';`);
  console.log(`UPDATE public.subscription_tiers SET stripe_price_id = '${premiumPriceId}' WHERE id = 'premium';`);
  console.log('\n');
}

// Spusti skript
createProducts()
  .then(() => {
    console.log('✅ Hotovo!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Neočakávaná chyba:', error);
    process.exit(1);
  });
