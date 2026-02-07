import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalyticsCharts } from '../AnalyticsCharts';

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Cell: () => <div data-testid="cell" />,
}));

describe('AnalyticsCharts Component', () => {
  it('should render date range selector', () => {
    render(<AnalyticsCharts />);

    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('should render all chart sections', () => {
    render(<AnalyticsCharts />);

    expect(screen.getByText('Bookings Trend')).toBeInTheDocument();
    expect(screen.getByText('Revenue by Service')).toBeInTheDocument();
    expect(screen.getByText('Booking Distribution')).toBeInTheDocument();
    expect(screen.getByText('No-Show Rate Trend')).toBeInTheDocument();
  });

  it('should render line chart for bookings trend', () => {
    render(<AnalyticsCharts />);

    const lineChart = screen.getByTestId('line-chart');
    expect(lineChart).toBeInTheDocument();
  });

  it('should render bar chart for revenue', () => {
    render(<AnalyticsCharts />);

    const barChart = screen.getByTestId('bar-chart');
    expect(barChart).toBeInTheDocument();
  });

  it('should render pie chart for distribution', () => {
    render(<AnalyticsCharts />);

    const pieCharts = screen.getAllByTestId('pie-chart');
    expect(pieCharts.length).toBeGreaterThan(0);
  });

  it('should render area chart for no-show rate', () => {
    render(<AnalyticsCharts />);

    const areaChart = screen.getByTestId('area-chart');
    expect(areaChart).toBeInTheDocument();
  });

  it('should handle date range selection', async () => {
    const user = userEvent.setup();
    render(<AnalyticsCharts />);

    const weeklyButton = screen.getByText('Weekly');
    await user.click(weeklyButton);

    expect(weeklyButton).toHaveClass('bg-blue-600');
  });

  it('should toggle between date ranges', async () => {
    const user = userEvent.setup();
    render(<AnalyticsCharts />);

    const dailyButton = screen.getByText('Daily');
    const weeklyButton = screen.getByText('Weekly');
    const monthlyButton = screen.getByText('Monthly');

    // Initially monthly is selected
    expect(monthlyButton).toHaveClass('bg-blue-600');

    // Click daily
    await user.click(dailyButton);
    expect(dailyButton).toHaveClass('bg-blue-600');
    expect(monthlyButton).not.toHaveClass('bg-blue-600');

    // Click weekly
    await user.click(weeklyButton);
    expect(weeklyButton).toHaveClass('bg-blue-600');
    expect(dailyButton).not.toHaveClass('bg-blue-600');
  });

  it('should render responsive containers', () => {
    render(<AnalyticsCharts />);

    const containers = screen.getAllByTestId('responsive-container');
    expect(containers.length).toBeGreaterThan(0);
  });

  it('should render chart axes', () => {
    render(<AnalyticsCharts />);

    const xAxes = screen.getAllByTestId('x-axis');
    const yAxes = screen.getAllByTestId('y-axis');

    expect(xAxes.length).toBeGreaterThan(0);
    expect(yAxes.length).toBeGreaterThan(0);
  });

  it('should render tooltips for all charts', () => {
    render(<AnalyticsCharts />);

    const tooltips = screen.getAllByTestId('tooltip');
    expect(tooltips.length).toBeGreaterThan(0);
  });

  it('should render grid lines', () => {
    render(<AnalyticsCharts />);

    const grids = screen.getAllByTestId('grid');
    expect(grids.length).toBeGreaterThan(0);
  });

  it('should render legends', () => {
    render(<AnalyticsCharts />);

    const legends = screen.getAllByTestId('legend');
    expect(legends.length).toBeGreaterThan(0);
  });

  it('should have dark mode classes', () => {
    const { container } = render(<AnalyticsCharts />);

    // Check for dark mode classes
    const darkElements = container.querySelectorAll('[class*="dark:"]');
    expect(darkElements.length).toBeGreaterThan(0);
  });

  it('should render spacing for layout', () => {
    const { container } = render(<AnalyticsCharts />);

    const spaceDiv = container.querySelector('[class*="space-y"]');
    expect(spaceDiv).toBeInTheDocument();
  });

  it('should render in a responsive grid for smaller charts', () => {
    const { container } = render(<AnalyticsCharts />);

    const gridDivs = container.querySelectorAll('[class*="grid"]');
    expect(gridDivs.length).toBeGreaterThan(0);
  });

  it('should have accessible labels', () => {
    render(<AnalyticsCharts />);

    expect(screen.getByText('Bookings Trend')).toBeInTheDocument();
    expect(screen.getByText('Revenue by Service')).toBeInTheDocument();
  });
});
