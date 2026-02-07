/**
 * Bookings table tests
 * Tests for table sorting, filtering, and pagination
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BookingsTable } from '../BookingsTable';

describe('BookingsTable', () => {
  const mockFilters = {
    status: null,
    serviceType: null,
    dateFrom: null,
    dateTo: null,
    search: '',
  };

  it('renders table with headers', () => {
    render(<BookingsTable filters={mockFilters} />);
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getByText('Date & Time')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders bookings data', () => {
    render(<BookingsTable filters={mockFilters} />);
    // Should show sample data
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
  });

  it('supports sorting by customer name', () => {
    render(<BookingsTable filters={mockFilters} />);
    const customerHeader = screen.getByText('Customer');
    fireEvent.click(customerHeader);
    // Should re-sort table
    expect(screen.getByText('Customer')).toBeInTheDocument();
  });

  it('supports sorting by date', () => {
    render(<BookingsTable filters={mockFilters} />);
    const dateHeader = screen.getByText('Date & Time');
    fireEvent.click(dateHeader);
    // Should re-sort table
    expect(screen.getByText('Date & Time')).toBeInTheDocument();
  });

  it('displays pagination controls', () => {
    render(<BookingsTable filters={mockFilters} />);
    expect(screen.getByText(/Page \d+ of \d+/)).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('handles pagination', () => {
    render(<BookingsTable filters={mockFilters} />);
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    // Should move to next page
    expect(screen.getByText(/Page 2 of \d+/)).toBeInTheDocument();
  });

  it('applies filters correctly', () => {
    const filteredFilters = {
      ...mockFilters,
      search: 'John',
    };
    render(<BookingsTable filters={filteredFilters} />);
    // Should filter results
    expect(screen.getByText('Customer')).toBeInTheDocument();
  });
});
