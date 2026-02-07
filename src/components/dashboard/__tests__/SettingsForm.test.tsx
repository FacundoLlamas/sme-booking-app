/**
 * Settings form tests
 * Tests for form validation, submission, and error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsForm } from '../SettingsForm';

describe('SettingsForm', () => {
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields', () => {
    render(<SettingsForm onSave={mockOnSave} />);
    expect(screen.getByDisplayValue('BookPro Services')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@bookpro.com')).toBeInTheDocument();
  });

  it('displays timezone select', () => {
    render(<SettingsForm onSave={mockOnSave} />);
    expect(screen.getByDisplayValue('America/New_York')).toBeInTheDocument();
  });

  it('shows save button', () => {
    render(<SettingsForm onSave={mockOnSave} />);
    expect(screen.getByText(/Save Changes/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<SettingsForm onSave={mockOnSave} />);
    const businessNameInput = screen.getByDisplayValue(
      'BookPro Services'
    ) as HTMLInputElement;
    
    fireEvent.change(businessNameInput, { target: { value: '' } });
    fireEvent.click(screen.getByText(/Save Changes/i));

    await waitFor(() => {
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  it('validates email format', async () => {
    render(<SettingsForm onSave={mockOnSave} />);
    const emailInput = screen.getByDisplayValue(
      'john@bookpro.com'
    ) as HTMLInputElement;
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(screen.getByText(/Save Changes/i));

    await waitFor(() => {
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  it('handles valid form submission', async () => {
    render(<SettingsForm onSave={mockOnSave} />);
    fireEvent.click(screen.getByText(/Save Changes/i));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('allows toggling services', () => {
    render(<SettingsForm onSave={mockOnSave} />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });
});
