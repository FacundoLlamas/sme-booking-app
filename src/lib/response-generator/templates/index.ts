/**
 * Response Templates Index
 * Exports all service-specific response templates
 */

import * as plumbingTemplates from './plumbing';
import * as electricalTemplates from './electrical';
import * as hvacTemplates from './hvac';
import * as maintenanceTemplates from './general-maintenance';
import * as landscapingTemplates from './landscaping';
import * as defaultTemplates from './default';

export const ALL_TEMPLATES = {
  plumbing: plumbingTemplates.RESPONSES,
  electrical: electricalTemplates.RESPONSES,
  hvac: hvacTemplates.RESPONSES,
  general_maintenance: maintenanceTemplates.RESPONSES,
  painting: maintenanceTemplates.RESPONSES, // Painting uses general maintenance templates
  landscaping: landscapingTemplates.RESPONSES,
  handyman: maintenanceTemplates.RESPONSES, // Handyman uses general maintenance templates
  default: defaultTemplates.RESPONSES,
};

/**
 * Get template set for a service type
 */
export function getServiceTemplates(serviceType: string) {
  const serviceKey = serviceType.toLowerCase().replace(/\s+/g, '_');
  return ALL_TEMPLATES[serviceKey as keyof typeof ALL_TEMPLATES] || ALL_TEMPLATES.default;
}
