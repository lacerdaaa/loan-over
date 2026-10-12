import Stripe from 'stripe';
import { UserBilling } from '../user/user.entity';

const MS_PER_SECOND = 1000;
const FREE_PLAN_STATUSES: readonly string[] = ['canceled', 'incomplete_expired'];

const customerId = (customer: Stripe.Subscription['customer']): string =>
  typeof customer === 'string' ? customer : customer.id;

const periodEnd = (subscription: Stripe.Subscription): Date | null => {
  const [item] = subscription.items.data;
  return item ? new Date(item.current_period_end * MS_PER_SECOND) : null;
};

export const toBillingFields = (subscription: Stripe.Subscription): UserBilling => ({
  plan: FREE_PLAN_STATUSES.includes(subscription.status) ? 'free' : 'pro',
  stripe_customer_id: customerId(subscription.customer),
  stripe_subscription_id: subscription.id,
  subscription_status: subscription.status,
  current_period_end: periodEnd(subscription),
});
