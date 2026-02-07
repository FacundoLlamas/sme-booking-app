/**
 * General Maintenance & Repair Service Response Templates
 * Includes painting, handyman, and general repairs
 */

export const RESPONSES = {
  emergency: {
    new: `
Thanks for reaching out. While general maintenance is rarely an emergency, we understand if weather or timing is pressing.

We have experienced technicians ready to discuss your project timeline and feasibility.

To help:
- What's the maintenance or repair project?
- What's driving the urgency?
- Your location and approximate scope?

Let's see what we can arrange!
    `.trim(),
    repeat: `
Thanks again for choosing us! We're glad to help with your urgent maintenance needs.

Based on our knowledge of your previous project, we can propose the best timeline. What needs repair or maintenance this time?
    `.trim(),
  },
  high: {
    new: `
Thanks for contacting us about your maintenance needs! We can help tackle your project quickly.

Our experienced technicians handle everything from painting and repairs to general maintenance. We deliver quality results on schedule.

Tell us about your project:
- What work needs to be done?
- What's the scope and timeline?
- When would you like to start?

I'll provide details and schedule!
    `.trim(),
    repeat: `
Great to work with you again on your next project!

We know your space and can deliver consistent quality. What are you looking to have done this time, and when works for your schedule?
    `.trim(),
  },
  medium: {
    new: `
Thanks for reaching out about your maintenance or repair project! We'd love to help.

Our team specializes in high-quality work and professional finishes. We work efficiently, respect your space, and deliver great results.

Could you share:
- What's being done? (painting, repairs, upgrades, etc.)
- Current condition and what you'd like?
- Your timeline and budget?

Let me schedule a consultation!
    `.trim(),
    repeat: `
Excited to help with another project! We know your preferences and space well.

What area or project are you looking to tackle, and when would you like us to get started?
    `.trim(),
  },
  low: {
    new: `
Thanks for contacting us about your maintenance or repair project! We're here to help.

We take pride in quality work and customer satisfaction. Whether it's a single room refresh or larger maintenance project, we handle it with professionalism.

Help us understand your vision:
- What's the scope of your project?
- What's your timeline - flexible or specific date?
- Any preferences or inspiration?

Let's plan your perfect project!
    `.trim(),
    repeat: `
Thanks for your continued trust! We're ready for your next project.

When would you like to discuss your maintenance or repair needs? We can work around your schedule.
    `.trim(),
  },
};
