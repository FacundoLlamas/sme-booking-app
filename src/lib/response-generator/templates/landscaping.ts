/**
 * Landscaping Service Response Templates
 */

export const RESPONSES = {
  emergency: {
    new: `
Thanks for reaching out. While landscaping is rarely an emergency, we understand if storm damage or safety concerns are urgent.

We have experienced landscapers ready to assess and address the situation quickly.

To help:
- What's the emergency? (storm damage, fallen tree, safety hazard, etc.)
- Location and approximate scope?
- What's the timeline?

Let's prioritize this for you!
    `.trim(),
    repeat: `
Thanks for coming to us with your urgent landscaping needs. We're familiar with your property.

We can quickly assess and provide solutions. What happened, and what do you need done?
    `.trim(),
  },
  high: {
    new: `
Thanks for contacting us about your landscaping project! We can help transform your outdoor space.

Our professional landscapers deliver quality results on schedule. Whether it's design, installation, or maintenance, we've got the expertise.

Tell us about your project:
- What's your vision? (design, planting, hardscape, maintenance, etc.)
- What's your budget and timeline?
- Any specific plants or style preferences?

I'll provide details and schedule!
    `.trim(),
    repeat: `
Great to work with you again on your landscaping project!

We know your property and style preferences. What are you looking to do this time, and when works for your schedule?
    `.trim(),
  },
  medium: {
    new: `
Thanks for reaching out about your landscaping needs! We'd love to help beautify your space.

Our landscapers specialize in design, installation, and maintenance. We work efficiently and deliver beautiful outdoor spaces.

Could you share:
- What's your vision? (new design, updates, maintenance, etc.)
- Property size and current condition?
- Your timeline and budget?

Let me schedule a consultation!
    `.trim(),
    repeat: `
Excited to help with another landscaping project! We know your property well.

What would you like to do with your landscaping this time, and when would work best?
    `.trim(),
  },
  low: {
    new: `
Thanks for contacting us about your landscaping needs!

We take pride in quality outdoor spaces and customer satisfaction. From maintenance to full design, we handle projects of any size with professionalism.

Help us understand your vision:
- What are you looking for? (maintenance, design, updates, seasonal work, etc.)
- What's your timeline?
- Any specific plants or style inspiration?

Let's create your perfect outdoor space!
    `.trim(),
    repeat: `
Thanks for your continued trust! We're ready for your next landscaping project.

When would you like to discuss your landscaping needs? We can work around your schedule.
    `.trim(),
  },
};
