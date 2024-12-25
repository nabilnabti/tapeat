import { loadStripe } from '@stripe/stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';

const STRIPE_PUBLIC_KEY = 'pk_test_51PH7PV1LCdahk0ySP7Kcm127sOdgOuOKSBNxVuIegQhWgi0AvXL4NupqnQY0wDQPEo38AJi3wV9mrFdAzSLvFGXG00PttU7DHT';
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

export const initializePaymentSheet = async (amount: number, orderId: string, restaurantId: string) => {
  try {
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe not loaded');

    const functions = getFunctions();
    const createPaymentIntentFn = httpsCallable(functions, 'createPaymentIntent');
    
    const { data } = await createPaymentIntentFn({
      amount,
      currency: 'eur',
      orderId,
      restaurantId
    });

    const { clientSecret } = data as { clientSecret: string };

    const { error } = await stripe.initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'TapEat',
      applePay: {
        merchantCountryCode: 'FR',
      },
      googlePay: {
        merchantCountryCode: 'FR',
        testEnv: true,
      },
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#10B981',
        },
      },
    });

    if (error) throw error;

    return { clientSecret };
  } catch (error) {
    console.error('Error initializing payment sheet:', error);
    throw error;
  }
};

export const presentPaymentSheet = async () => {
  try {
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe not loaded');

    const { error } = await stripe.presentPaymentSheet();
    
    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error presenting payment sheet:', error);
    throw error;
  }
};