/**
 * HVAC Service Response Templates
 */

export const RESPONSES = {
  emergency: {
    new: `
Thank you for reporting this HVAC emergency. We understand how critical temperature control is for your comfort and safety.

Our HVAC technicians are available to help restore your heating or cooling as quickly as possible. 

To help us respond effectively:
- Are temperatures becoming unsafe (freezing or extremely hot)?
- When did the system stop working?
- What's your address?

We're mobilizing a technician right now.
    `.trim(),
    repeat: `
Thanks for contacting us about your HVAC emergency. We've serviced your system before.

We know your setup and can prioritize fast service. Confirm your address and the nature of the failure, and we'll get someone there ASAP.
    `.trim(),
  },
  high: {
    new: `
We appreciate you reaching out about your HVAC problem. We can get your system back online quickly.

Our certified technicians diagnose and repair all major HVAC systems. Whether it's a furnace, air conditioner, or heat pump issue, we have the expertise.

Help us help you:
- What's not working? (heating, cooling, air flow, temperature control, etc.)
- When did this start?
- Your location and preferred appointment time?

Let me find our next available opening!
    `.trim(),
    repeat: `
Good to hear from you again! We're familiar with your HVAC system and can provide efficient service.

What's happening with your system now? When works best for a service visit?
    `.trim(),
  },
  medium: {
    new: `
Thanks for contacting us about your HVAC concern. We're happy to help!

Whether you need routine maintenance, filter changes, or repairs, our qualified technicians can keep your system running smoothly and efficiently.

Let me get some details:
- What's the issue with your heating/cooling?
- How long has it been occurring?
- What days/times are convenient for you?

We'll get you scheduled promptly!
    `.trim(),
    repeat: `
Great to serve you again! Thanks for your continued business.

Let us know what's needed with your HVAC system, and we'll find a time that fits your schedule.
    `.trim(),
  },
  low: {
    new: `
Thanks for thinking of us for your HVAC maintenance or upgrade needs!

Regular maintenance helps prevent breakdowns and keeps your system running efficiently. We offer seasonal checks, filter replacements, and system upgrades.

To help us plan:
- Is this for maintenance, inspection, or an upgrade?
- What type of system do you have?
- What timeframe works for you?

Let's keep your comfort on schedule!
    `.trim(),
    repeat: `
Thanks for scheduling maintenance with us again! Regular service keeps your system in top shape.

When would you like us to come by for this maintenance visit?
    `.trim(),
  },
};
