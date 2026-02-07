/**
 * Default/Fallback Service Response Templates
 * Used for services that don't match specific categories
 */

export const RESPONSES = {
  emergency: {
    new: `
Thank you for reaching out to us about your urgent service need. We take your emergency seriously.

Our team is mobilized and ready to help. To ensure we send the right professional:

Could you provide:
- A brief description of the issue?
- Your address and contact information?
- The best way to reach you?

We'll prioritize your request and provide rapid response.
    `.trim(),
    repeat: `
Thanks for coming back to us in your time of need. We appreciate your trust.

Tell us what's happening, and we'll dispatch our team immediately. What's your address again?
    `.trim(),
  },
  high: {
    new: `
Thanks for contacting us about your service request. We're ready to help you.

Our professional team can assist with your needs. Let me get a few details:

- What specific service do you need?
- When would be a good time for us to visit?
- Your location and access information?

I'll find our earliest available appointment for you!
    `.trim(),
    repeat: `
Good to hear from you again! We're happy to help with another service request.

What do you need assistance with this time? When works best for you?
    `.trim(),
  },
  medium: {
    new: `
Thanks for reaching out! We're here to help with your service needs.

Our experienced team is ready to assist. Tell me:
- What service are you looking for?
- When would you prefer an appointment?
- Any specific requirements or preferences?

Let me get you scheduled!
    `.trim(),
    repeat: `
Great to serve you again! We're familiar with your needs.

What can we help you with this time? Let's find a convenient time for your service.
    `.trim(),
  },
  low: {
    new: `
Thanks for contacting us about your service request!

We're flexible and can work around your schedule. What do you need, and when would be good for a visit?

Let me help you get booked!
    `.trim(),
    repeat: `
Thanks for your continued business! We're ready when you are.

What service do you need this time? When works for your schedule?
    `.trim(),
  },
};
