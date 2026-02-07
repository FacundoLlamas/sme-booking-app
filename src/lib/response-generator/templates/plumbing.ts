/**
 * Plumbing Service Response Templates
 */

export const RESPONSES = {
  emergency: {
    new: `
Thank you for contacting us about your urgent plumbing emergency! We understand how stressful a water emergency can be.

We have experienced technicians available to help. They can typically arrive within the next hour to assess the situation and provide emergency repairs.

To help us dispatch the right professional:
- Can you confirm your address?
- Is the water still actively flowing/leaking?
- Have you attempted any initial mitigation (like shutting off the main valve)?

We're standing by to get this resolved for you quickly.
    `.trim(),
    repeat: `
Welcome back! We're sorry to hear you're experiencing another plumbing emergency. Thanks for choosing us again.

Based on your previous service history, we know your property well. Our team can prioritize your emergency and have someone there soon.

Let's confirm:
- Is this at the same location as before?
- What's the nature of the emergency?

We'll get this handled right away!
    `.trim(),
  },
  high: {
    new: `
Thanks for reaching out about your plumbing issue. We can help get this fixed today or tomorrow depending on our current availability.

Our licensed plumbers specialize in everything from major repairs to preventive maintenance. 

To help us better assist you:
- What's the specific issue? (leak, blockage, fixture malfunction, etc.)
- When would you prefer to have someone visit?
- What's your address?

I'll check our availability and suggest some appointment times.
    `.trim(),
    repeat: `
Great to hear from you again! We're familiar with your property and past issues.

Our team is ready to tackle this for you. When would work best for a visit - today or tomorrow? Once you let us know, I'll find the first available slot.
    `.trim(),
  },
  medium: {
    new: `
Thanks for contacting us about your plumbing concern. We'd be happy to help fix this.

Whether it's a slow drain, running toilet, or faucet issue, our experienced plumbers can diagnose and repair it efficiently.

A few details to help us serve you better:
- What's the specific problem? (drain issue, fixture malfunction, water quality, etc.)
- Has this been ongoing or just started?
- What days/times work best for you?

Let me find you some appointment options!
    `.trim(),
    repeat: `
Good to hear from you! We appreciate your repeat business.

We know your setup from our last visit. Let us know what's happening now, and we'll get you scheduled at a time that's convenient for you.
    `.trim(),
  },
  low: {
    new: `
Thanks for reaching out! We're glad to help with your plumbing maintenance or minor repair.

Our team can handle everything from preventive inspections to small fixture updates. We're flexible with scheduling to work around your calendar.

Could you tell me:
- What's the specific work you need?
- Are there any days/times that are particularly inconvenient?
- Should we plan for a full inspection or focus on one area?

Let's find a time that works for you!
    `.trim(),
    repeat: `
Welcome back! Thanks for continuing to trust us with your plumbing needs.

We'd love to help with this maintenance or minor work. What timeframe works best for you - this week, next week, or something more flexible?
    `.trim(),
  },
};
