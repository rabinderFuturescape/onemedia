# SAAS Billing

A comprehensive billing integration for SAAS applications using [Lago](https://getlago.com) as the billing engine.

## Overview

This module provides a complete solution for implementing subscription billing, usage-based billing, and invoicing in your SAAS application. It integrates with Lago, an open-source billing API, to provide a flexible and scalable billing system.

## Features

- **Customer Management**: Create, update, and manage customers in the billing system
- **Subscription Management**: Subscribe customers to plans, manage subscription lifecycle
- **Usage Tracking**: Track usage events for metered billing
- **Invoice Management**: Generate and manage invoices
- **Multi-Currency Support**: Support for multiple currencies
- **Flexible Pricing Models**: Support for various pricing models (flat rate, tiered, volume, etc.)

## Installation

```bash
npm install saas-billing
```

## Configuration

Create a `.env` file with your Lago API credentials:

```
LAGO_API_KEY=your-lago-api-key
LAGO_API_URL=https://api.getlago.com/api/v1
```

Or configure the module programmatically:

```typescript
import { BillingService } from 'saas-billing';

const billingService = new BillingService({
  apiKey: 'your-lago-api-key',
  baseUrl: 'https://api.getlago.com/api/v1',
});
```

## Usage

### Initialize the Billing Service

```typescript
import { BillingService } from 'saas-billing';

const billingService = new BillingService();
```

### Customer Management

```typescript
// Create a customer
const customer = await billingService.syncCustomer({
  customerId: 'customer-123',
  name: 'Acme Inc.',
  email: 'billing@acme.com',
  currency: 'USD',
});

// Get a customer
const customer = await billingService.getCustomerService().getCustomer('customer-123');

// Update a customer
const updatedCustomer = await billingService.getCustomerService().updateCustomer({
  customerId: 'customer-123',
  name: 'Acme Corporation',
});
```

### Subscription Management

```typescript
// Subscribe a customer to a plan
const subscription = await billingService.subscribeCustomerToPlan(
  'customer-123',
  'plan-456',
  {
    name: 'Team Plan Subscription',
    billingTime: 'calendar',
  }
);

// Get customer subscriptions
const { subscriptions } = await billingService.getCustomerSubscriptionStatus('customer-123');

// Cancel a subscription
await billingService.getSubscriptionService().cancelSubscription({
  subscriptionId: 'subscription-789',
});
```

### Usage Tracking

```typescript
// Track usage for a customer
await billingService.trackUsage(
  'customer-123',
  'api_calls',
  { count: 100 }
);

// Track batch usage
await billingService.trackBatchUsage([
  {
    customerId: 'customer-123',
    code: 'api_calls',
    properties: { count: 100 },
  },
  {
    customerId: 'customer-456',
    code: 'storage',
    properties: { gigabytes: 5 },
  },
]);
```

### Invoice Management

```typescript
// Create a one-time invoice
const invoice = await billingService.createOneTimeInvoice(
  'customer-123',
  'USD',
  [
    {
      amountCents: 10000, // $100.00
      description: 'Consulting services',
    },
  ]
);

// Get customer invoices
const invoices = await billingService.getInvoiceService().getCustomerInvoices('customer-123');

// Finalize a draft invoice
await billingService.getInvoiceService().finalizeInvoice('invoice-123');
```

## API Reference

### BillingService

The main service that provides access to all other services.

```typescript
const billingService = new BillingService(config);
```

#### Methods

- `getCustomerService()`: Get the customer service
- `getPlanService()`: Get the plan service
- `getSubscriptionService()`: Get the subscription service
- `getBillableMetricService()`: Get the billable metric service
- `getEventService()`: Get the event service
- `getInvoiceService()`: Get the invoice service
- `syncCustomer(customer)`: Create or update a customer
- `subscribeCustomerToPlan(customerId, planId, options)`: Subscribe a customer to a plan
- `trackUsage(customerId, metricCode, properties, subscriptionId)`: Track usage for a customer
- `trackBatchUsage(events)`: Track batch usage
- `createOneTimeInvoice(customerId, currency, fees, metadata)`: Create a one-time invoice
- `getCustomerSubscriptionStatus(customerId)`: Get customer subscription status
- `cancelAllCustomerSubscriptions(customerId)`: Cancel all active subscriptions for a customer

### CustomerService

Service for managing customers.

```typescript
const customerService = billingService.getCustomerService();
```

#### Methods

- `createCustomer(customer)`: Create a new customer
- `getCustomer(customerId)`: Get a customer by ID
- `updateCustomer(customer)`: Update a customer
- `deleteCustomer(customerId)`: Delete a customer
- `getCustomers(page, perPage)`: Get all customers
- `findCustomerByExternalId(externalId)`: Find a customer by external ID
- `customerExists(customerId)`: Check if a customer exists

### SubscriptionService

Service for managing subscriptions.

```typescript
const subscriptionService = billingService.getSubscriptionService();
```

#### Methods

- `createSubscription(subscription)`: Create a new subscription
- `getSubscription(subscriptionId)`: Get a subscription by ID
- `updateSubscription(subscription)`: Update a subscription
- `terminateSubscription(subscription)`: Terminate a subscription
- `cancelSubscription(subscription)`: Cancel a subscription
- `getSubscriptions(page, perPage, customerId, planId, status)`: Get all subscriptions
- `getCustomerSubscriptions(customerId, page, perPage)`: Get all subscriptions for a customer
- `getActiveCustomerSubscriptions(customerId, page, perPage)`: Get all active subscriptions for a customer
- `hasActiveSubscription(customerId, planId)`: Check if a customer has an active subscription to a plan

### EventService

Service for tracking usage events.

```typescript
const eventService = billingService.getEventService();
```

#### Methods

- `createEvent(event)`: Create a new event
- `createEvents(events)`: Create multiple events in a batch
- `trackUsage(customerId, code, properties, subscriptionId)`: Track a usage event
- `trackBatchUsage(events)`: Track multiple usage events

### InvoiceService

Service for managing invoices.

```typescript
const invoiceService = billingService.getInvoiceService();
```

#### Methods

- `createInvoice(invoice)`: Create a new invoice
- `getInvoice(invoiceId)`: Get an invoice by ID
- `updateInvoice(invoice)`: Update an invoice
- `finalizeInvoice(invoiceId)`: Finalize a draft invoice
- `voidInvoice(invoiceId)`: Void an invoice
- `downloadInvoice(invoiceId)`: Download an invoice PDF
- `getInvoices(page, perPage, customerId, status)`: Get all invoices
- `getCustomerInvoices(customerId, page, perPage)`: Get all invoices for a customer
- `getFinalizedCustomerInvoices(customerId, page, perPage)`: Get all finalized invoices for a customer

## Integration with Lago

This module integrates with [Lago](https://getlago.com), an open-source billing API. Lago provides:

- **Flexible Pricing Models**: Support for various pricing models (flat rate, tiered, volume, etc.)
- **Usage-Based Billing**: Track and bill based on usage
- **Subscription Management**: Manage recurring subscriptions
- **Invoice Generation**: Generate and manage invoices
- **Payment Provider Integration**: Integrate with payment providers like Stripe

To use this module, you need to have a Lago account and API key. You can sign up for a Lago account at [getlago.com](https://getlago.com).

## License

MIT
