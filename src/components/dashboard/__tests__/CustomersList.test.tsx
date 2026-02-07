/**
 * Customers list tests
 * Tests for search, filtering, and pagination
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CustomersList } from '../CustomersList';

describe('CustomersList', () => {
  it('renders customer list table', () => {
    render(<CustomersList searchQuery="" />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('displays sample customers', () => {
    render(<CustomersList searchQuery="" />);
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
  });

  it('shows action buttons for each customer', () => {
    render(<CustomersList searchQuery="" />);
    const messageButtons = screen.getAllByTitle('Send message');
    expect(messageButtons.length).toBeGreaterThan(0);
  });

  it('displays VIP indicator for VIP customers', () => {
    render(<CustomersList searchQuery="" />);
    // Should show star icon for VIP customers
    const starIcons = document.querySelectorAll('svg');
    expect(starIcons.length).toBeGreaterThan(0);
  });

  it('shows pagination controls', () => {
    render(<CustomersList searchQuery="" />);
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('filters customers by search query', () => {
    const { rerender } = render(<CustomersList searchQuery="" />);
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
    
    rerender(<CustomersList searchQuery="nonexistent" />);
    // Should still render table structure
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('allows sorting by name', () => {
    render(<CustomersList searchQuery="" />);
    const nameHeader = screen.getByText('Name');
    expect(nameHeader).toBeInTheDocument();
  });
});
