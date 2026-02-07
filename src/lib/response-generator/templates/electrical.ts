/**
 * Electrical Service Response Templates
 */

export const RESPONSES = {
  emergency: {
    new: `
Thank you for reporting this electrical emergency. We take electrical safety very seriously.

Our licensed electricians are trained to handle emergency situations safely. IMPORTANT: For safety, please do not attempt to use the affected electrical system.

We need to know:
- Is anyone in danger or experiencing electrical shock?
- Is there visible sparking, burning smell, or smoke?
- What's your address and how soon can we access the property?

We're dispatching help immediately.
    `.trim(),
    repeat: `
Thanks for calling us about your electrical emergency. We've worked on your property before and can respond quickly.

For your safety, please avoid using any electrical systems related to the problem. Can you confirm your address so we can dispatch our technician right away?
    `.trim(),
  },
  high: {
    new: `
We appreciate you reporting this electrical issue to us. We can help restore your power and safety.

Our certified electricians specialize in diagnosing electrical problems quickly. Whether it's a tripped breaker, power outage, or circuit problem, we have solutions.

Please tell us:
- What specifically happened? (flickering lights, complete power loss, breaker tripped, etc.)
- Which areas are affected?
- Your address and access instructions?

I'll find our earliest available time to visit.
    `.trim(),
    repeat: `
Thanks for reaching back out to us. We're familiar with your electrical system from our previous work.

We can get someone out there quickly to investigate. What's happening now, and when can we schedule a visit?
    `.trim(),
  },
  medium: {
    new: `
Thanks for contacting us about your electrical concern. We're here to help!

Whether you're dealing with flickering lights, outlet issues, or need an electrical inspection, our licensed electricians can help. We work efficiently to minimize disruption to your home or business.

Let me gather some info:
- What's the electrical issue you're experiencing?
- How long has this been going on?
- What times work best for a visit?

We'll get you on the schedule!
    `.trim(),
    repeat: `
Great to work with you again! We're ready to help with your electrical needs.

Based on our knowledge of your property, we can provide efficient service. When would you like us to come by?
    `.trim(),
  },
  low: {
    new: `
Thanks for reaching out about your electrical maintenance or upgrade needs!

Our electricians can help with installations, upgrades, or preventive inspections. We provide professional service with transparent pricing.

Could you share:
- What's the specific electrical work you need?
- Do you have any timeline preferences?
- Are there any access restrictions we should know about?

Let me find the perfect time for your visit!
    `.trim(),
    repeat: `
Thanks for continued trust in our electrical services! 

What electrical work are you looking to have done this time? Let us know your preferences, and we'll get you scheduled.
    `.trim(),
  },
};
