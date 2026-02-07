/**
 * Dashboard tests
 * Tests for dashboard layout, components, and functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '../page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard page without errors', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('displays key metrics section', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Total Bookings')).toBeInTheDocument();
      expect(screen.getByText('Active Customers')).toBeInTheDocument();
    });
  });

  it('displays recent bookings', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText(/Recent Bookings/i)).toBeInTheDocument();
    });
  });

  it('displays upcoming appointments', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText(/Today's Schedule/i)).toBeInTheDocument();
    });
  });

  it('shows getting started card with settings link', () => {
    render(<DashboardPage />);
    const settingsLink = screen.getByText('Go to Settings');
    expect(settingsLink).toHaveAttribute('href', '/dashboard/settings');
  });
});
