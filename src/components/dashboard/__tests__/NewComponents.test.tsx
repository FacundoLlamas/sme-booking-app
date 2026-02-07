import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WidgetCard } from '../WidgetCard';
import { MetricCard } from '../MetricCard';
import { FilterPanel } from '../FilterPanel';
import { ExportButton } from '../ExportButton';
import { EmptyState } from '../EmptyState';
import { DataTable, Column } from '../DataTable';
import { BarChart3, Activity, Trash2 } from 'lucide-react';

describe('WidgetCard Component', () => {
  it('should render widget card with title and children', () => {
    render(
      <WidgetCard id="widget-1" title="Test Widget">
        <p>Widget content</p>
      </WidgetCard>,
    );

    expect(screen.getByText('Test Widget')).toBeInTheDocument();
    expect(screen.getByText('Widget content')).toBeInTheDocument();
  });

  it('should show remove button when removable prop is true', () => {
    const onRemove = vi.fn();
    render(
      <WidgetCard
        id="widget-1"
        title="Removable Widget"
        removable={true}
        onRemove={onRemove}
      >
        <p>Content</p>
      </WidgetCard>,
    );

    const removeButton = screen.getByLabelText('Remove widget');
    expect(removeButton).toBeInTheDocument();

    fireEvent.click(removeButton);
    expect(onRemove).toHaveBeenCalled();
  });

  it('should show drag handle when draggable prop is true', () => {
    render(
      <WidgetCard id="widget-1" title="Draggable" draggable={true}>
        <p>Content</p>
      </WidgetCard>,
    );

    expect(screen.getByLabelText('Drag handle')).toBeInTheDocument();
  });
});

describe('MetricCard Component', () => {
  it('should render metric with label and value', () => {
    render(<MetricCard label="Total Bookings" value={156} unit="bookings" />);

    expect(screen.getByText('Total Bookings')).toBeInTheDocument();
    expect(screen.getByText('156')).toBeInTheDocument();
    expect(screen.getByText('bookings')).toBeInTheDocument();
  });

  it('should display trend indicator', () => {
    render(
      <MetricCard
        label="Revenue"
        value={5000}
        trend={{ value: 12, isPositive: true, label: 'vs last month' }}
      />,
    );

    expect(screen.getByText(/12%/)).toBeInTheDocument();
    expect(screen.getByText(/vs last month/)).toBeInTheDocument();
  });

  it('should render icon when provided', () => {
    render(
      <MetricCard
        label="Active Services"
        value={8}
        icon={Activity}
        color="green"
      />,
    );

    expect(screen.getByText('Active Services')).toBeInTheDocument();
  });

  it('should render sparkline data', () => {
    const { container } = render(
      <MetricCard
        label="Trend"
        value={100}
        sparkData={[10, 20, 15, 30, 25]}
      />,
    );

    const sparkElements = container.querySelectorAll('[class*="bg-blue"]');
    expect(sparkElements.length).toBeGreaterThan(0);
  });
});

describe('FilterPanel Component', () => {
  const mockFilters = [
    {
      id: 'status',
      label: 'Status',
      options: [
        { id: 'confirmed', label: 'Confirmed', count: 45 },
        { id: 'pending', label: 'Pending', count: 12 },
      ],
    },
    {
      id: 'service',
      label: 'Service',
      options: [
        { id: 'plumbing', label: 'Plumbing' },
        { id: 'electrical', label: 'Electrical' },
      ],
    },
  ];

  it('should render filter groups', () => {
    render(
      <FilterPanel filters={mockFilters} activeFilters={{}} />,
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Service')).toBeInTheDocument();
  });

  it('should handle filter selection', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();

    render(
      <FilterPanel
        filters={mockFilters}
        activeFilters={{}}
        onFilterChange={onFilterChange}
      />,
    );

    const checkbox = screen.getByDisplayValue('confirmed');
    await user.click(checkbox);

    expect(onFilterChange).toHaveBeenCalledWith({ status: ['confirmed'] });
  });

  it('should clear all filters', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();

    render(
      <FilterPanel
        filters={mockFilters}
        activeFilters={{ status: ['confirmed'] }}
        onFilterChange={onFilterChange}
      />,
    );

    const clearButton = screen.getByText('Clear all');
    await user.click(clearButton);

    expect(onFilterChange).toHaveBeenCalledWith({});
  });

  it('should collapse/expand filter groups', async () => {
    const user = userEvent.setup();

    render(
      <FilterPanel filters={mockFilters} activeFilters={{} } />,
    );

    const statusButton = screen.getByText('Status');
    await user.click(statusButton);

    // The group should collapse
    expect(
      screen.queryByDisplayValue('confirmed'),
    ).not.toBeInTheDocument();
  });
});

describe('ExportButton Component', () => {
  const mockData = [
    { id: 1, name: 'John', email: 'john@example.com' },
    { id: 2, name: 'Jane', email: 'jane@example.com' },
  ];

  it('should render export button', () => {
    render(<ExportButton data={mockData} filename="test" />);

    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('should show export options on click', async () => {
    const user = userEvent.setup();

    render(<ExportButton data={mockData} filename="test" />);

    const button = screen.getByText('Export');
    await user.click(button);

    expect(screen.getByText('Export to CSV')).toBeInTheDocument();
    expect(screen.getByText('Export to JSON')).toBeInTheDocument();
  });

  it('should handle CSV export', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();

    const { container } = render(
      <ExportButton
        data={mockData}
        filename="test"
        onExport={onExport}
      />,
    );

    const button = screen.getByText('Export');
    await user.click(button);

    const csvButton = screen.getByText('Export to CSV');
    await user.click(csvButton);

    expect(onExport).toHaveBeenCalledWith('csv');
  });
});

describe('EmptyState Component', () => {
  it('should render empty state with title', () => {
    render(<EmptyState title="No bookings found" />);

    expect(screen.getByText('No bookings found')).toBeInTheDocument();
  });

  it('should render description and icon', () => {
    render(
      <EmptyState
        title="No data"
        description="Try adjusting filters"
        icon={BarChart3}
      />,
    );

    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting filters')).toBeInTheDocument();
  });

  it('should render action button', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(
      <EmptyState
        title="Empty"
        action={{
          label: 'Create New',
          onClick: onAction,
          variant: 'primary',
        }}
      />,
    );

    const button = screen.getByText('Create New');
    await user.click(button);

    expect(onAction).toHaveBeenCalled();
  });
});

describe('DataTable Component', () => {
  interface TestData {
    id: number;
    name: string;
    email: string;
    status: string;
  }

  const mockColumns: Column<TestData>[] = [
    {
      id: 'name',
      header: 'Name',
      accessor: (row) => row.name,
      sortable: true,
    },
    {
      id: 'email',
      header: 'Email',
      accessor: (row) => row.email,
      sortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (row) => row.status,
      sortable: false,
    },
  ];

  const mockData: TestData[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active' },
  ];

  it('should render table with data', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        rowKey={(row) => row.id}
      />,
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('should handle sorting', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        rowKey={(row) => row.id}
        sortable={true}
      />,
    );

    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);

    const rows = container.querySelectorAll('tbody tr');
    // First row should be Bob (sorted ascending)
    expect(rows[0]).toHaveTextContent('Bob Johnson');
  });

  it('should handle pagination', async () => {
    const user = userEvent.setup();
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      status: 'Active',
    }));

    render(
      <DataTable
        columns={mockColumns}
        data={largeData}
        rowKey={(row) => row.id}
        paginated={true}
        pageSize={10}
      />,
    );

    // Should show first 10 items
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.queryByText('User 11')).not.toBeInTheDocument();

    // Click next page
    const nextButton = screen.getByLabelText('Next page');
    await user.click(nextButton);

    expect(screen.getByText('User 11')).toBeInTheDocument();
    expect(screen.queryByText('User 1')).not.toBeInTheDocument();
  });

  it('should handle row click', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();

    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        rowKey={(row) => row.id}
        onRowClick={onRowClick}
      />,
    );

    const firstRow = screen.getByText('John Doe').closest('tr');
    await user.click(firstRow!);

    expect(onRowClick).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'John Doe' }),
    );
  });

  it('should display empty state when no data', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={[]}
        rowKey={(row) => row.id}
      />,
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
});
