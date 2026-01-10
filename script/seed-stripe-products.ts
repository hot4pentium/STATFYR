import { getUncachableStripeClient } from '../server/stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  console.log('Creating STATFYR subscription products...');

  const existingProducts = await stripe.products.search({ query: "name:'STATFYR'" });
  if (existingProducts.data.length > 0) {
    console.log('Products already exist, skipping creation');
    console.log('Existing products:', existingProducts.data.map(p => ({ id: p.id, name: p.name })));
    return;
  }

  const coachProduct = await stripe.products.create({
    name: 'STATFYR Coach Pro',
    description: 'Full access to StatTracker, PlayMaker, individual stats, roster promotion, and all highlights.',
    metadata: {
      tier: 'coach',
      features: 'stattracker,playmaker,individual-stats,roster-promotion,highlights'
    }
  });

  const coachPrice = await stripe.prices.create({
    product: coachProduct.id,
    unit_amount: 999,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { tier: 'coach' }
  });

  console.log('Created Coach Pro product:', coachProduct.id);
  console.log('Created Coach Pro price:', coachPrice.id, '($9.99/month)');

  const supporterProduct = await stripe.products.create({
    name: 'STATFYR Supporter Pro',
    description: 'Upload highlights for your athlete, view individual stats, track your own stats, and follow athletes across teams.',
    metadata: {
      tier: 'supporter',
      features: 'upload-highlights,individual-stats,own-stat-tracking,cross-team-following'
    }
  });

  const supporterPrice = await stripe.prices.create({
    product: supporterProduct.id,
    unit_amount: 599,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { tier: 'supporter' }
  });

  console.log('Created Supporter Pro product:', supporterProduct.id);
  console.log('Created Supporter Pro price:', supporterPrice.id, '($5.99/month)');

  console.log('\nProducts created successfully!');
  console.log('Coach Pro Price ID:', coachPrice.id);
  console.log('Supporter Pro Price ID:', supporterPrice.id);
}

createProducts().catch(console.error);
