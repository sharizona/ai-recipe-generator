import type { Schema } from '../../data/resource';
import Stripe from 'stripe';

export const handler: Schema["createCheckoutSession"]["functionHandler"] = async (event) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
  });

  const { credits } = event.arguments;

  // Get user info from Cognito identity
  const identity = event.identity as any;
  if (!identity || !identity.sub) {
    throw new Error('User not authenticated');
  }

  const userId = identity.sub as string;
  const userEmail = identity.claims?.email as string || '';

  // Define credit packages
  const packages: Record<number, { amount: number; name: string }> = {
    10: { amount: 999, name: '10 Credits' },      // $9.99
    25: { amount: 1999, name: '25 Credits' },     // $19.99
    50: { amount: 3499, name: '50 Credits' },     // $34.99
    100: { amount: 5999, name: '100 Credits' },   // $59.99
  };

  const selectedPackage = packages[credits];
  if (!selectedPackage) {
    throw new Error('Invalid credit package');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPackage.name,
              description: `${credits} recipe generation credits`,
            },
            unit_amount: selectedPackage.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing`,
      customer_email: userEmail as string,
      metadata: {
        userId,
        credits: credits.toString(),
      },
    });

    return {
      sessionId: session.id,
      url: session.url || '',
    };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw new Error('Failed to create checkout session');
  }
};
