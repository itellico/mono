import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminEditPage } from '../AdminEditPage';
import type { TabConfig, ValidationError } from '../AdminEditPage';

// Mock the translations
jest.mock('@/lib/translations/client', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock the form component
const MockForm = () => <div data-testid="mock-form">Form Content</div>;

// Mock the hooks and components
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('@/lib/browser-logger', () => ({
  browserLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/components/auth/PermissionGate', () => {
  return function MockPermissionGate({ children }: { children: React.ReactNode }) {
    return <div data-testid="permission-gate">{children}</div>;
  };
});

describe('AdminEditPage', () => {
  const mockTabs: TabConfig[] = [
    {
      key: 'basic',
      title: 'Basic Info',
      fields: [
        {
          key: 'name',
          label: 'Name',
          type: 'text',
          required: true,
        },
        {
          key: 'email',
          label: 'Email',
          type: 'email',
          required: true,
        },
      ],
    },
  ];

  const defaultProps = {
    title: 'Edit Entity',
    tabs: mockTabs,
    formData: { name: 'Test', email: 'test@example.com' },
    onFormChange: jest.fn(),
    onSave: jest.fn(),
    errors: [] as ValidationError[],
    onValidate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle undefined permissions gracefully', () => {
    // This test would have caught the undefined permissions error
    const userContextWithoutPermissions = {
      userId: 'user-123',
      adminRole: 'admin',
      tenantId: null,
      permissions: undefined // This caused the runtime error
    };

    // Should not throw an error
    expect(() => {
      render(
        <AdminEditPage
          title="Test Page"
          tabs={mockTabs}
          userContext={userContextWithoutPermissions}
          data={{}}
          isLoading={false}
          isSaving={false}
          isDeleting={false}
          errors={[]}
          onSave={jest.fn()}
          onValidate={jest.fn()}
          onFormChange={jest.fn()}
          isDirty={false}
        />
      );
    }).not.toThrow();
  });

  it('should handle null permissions gracefully', () => {
    const userContextWithNullPermissions = {
      userId: 'user-123',
      adminRole: 'admin',
      tenantId: null,
      permissions: null as any // This could also cause issues
    };

    expect(() => {
      render(
        <AdminEditPage
          title="Test Page"
          tabs={mockTabs}
          userContext={userContextWithNullPermissions}
          data={{}}
          isLoading={false}
          isSaving={false}
          isDeleting={false}
          errors={[]}
          onSave={jest.fn()}
          onValidate={jest.fn()}
          onFormChange={jest.fn()}
          isDirty={false}
        />
      );
    }).not.toThrow();
  });

  it('should show all tabs for super_admin even without permissions', () => {
    const superAdminContext = {
      userId: 'user-123',
      adminRole: 'super_admin',
      tenantId: null,
      permissions: undefined
    };

    render(
      <AdminEditPage
        title="Test Page"
        tabs={mockTabs}
        userContext={superAdminContext}
        data={{}}
        isLoading={false}
        isSaving={false}
        isDeleting={false}
        errors={[]}
        onSave={jest.fn()}
        onValidate={jest.fn()}
        onFormChange={jest.fn()}
        isDirty={false}
      />
    );

    // Super admin should see all tabs
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
  });

  it('should filter tabs based on permissions when permissions array exists', () => {
    const userContextWithPermissions = {
      userId: 'user-123',
      adminRole: 'admin',
      tenantId: null,
      permissions: ['read:tenants'] // Only has read permission
    };

    render(
      <AdminEditPage
        title="Test Page"
        tabs={mockTabs}
        userContext={userContextWithPermissions}
        data={{}}
        isLoading={false}
        isSaving={false}
        isDeleting={false}
        errors={[]}
        onSave={jest.fn()}
        onValidate={jest.fn()}
        onFormChange={jest.fn()}
        isDirty={false}
      />
    );

    // Should show only the tab user has permission for
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
  });

  it('should handle tabs without permission requirements', () => {
    const tabsWithoutPermissions = [
      {
        id: 'public',
        title: 'Public Tab',
        component: MockForm,
        // No permission requirement
      }
    ];

    const userContextWithoutPermissions = {
      userId: 'user-123',
      adminRole: 'user',
      tenantId: null,
      permissions: undefined
    };

    render(
      <AdminEditPage
        title="Test Page"
        tabs={tabsWithoutPermissions}
        userContext={userContextWithoutPermissions}
        data={{}}
        isLoading={false}
        isSaving={false}
        isDeleting={false}
        errors={[]}
        onSave={jest.fn()}
        onValidate={jest.fn()}
        onFormChange={jest.fn()}
        isDirty={false}
      />
    );

    // Tab without permission requirement should always be visible
    expect(screen.getByText('Public Tab')).toBeInTheDocument();
  });

  describe('Unsaved Changes Indicator', () => {
    it('should show unsaved changes badge when isDirty is true', () => {
      render(
        <AdminEditPage
          {...defaultProps}
          isDirty={true}
        />
      );

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    it('should NOT show unsaved changes badge when isDirty is false', () => {
      render(
        <AdminEditPage
          {...defaultProps}
          isDirty={false}
        />
      );

      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });

    it('should NOT show unsaved changes badge when isDirty is undefined', () => {
      render(
        <AdminEditPage
          {...defaultProps}
          // isDirty not provided (undefined)
        />
      );

      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });

    it('should handle undefined isDirty prop gracefully', () => {
      // This test would have caught the ReferenceError: hasUnsavedChanges is not defined
      expect(() => {
        render(
          <AdminEditPage
            {...defaultProps}
            isDirty={undefined}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<AdminEditPage {...defaultProps} />);
      expect(screen.getByText('Edit Entity')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<AdminEditPage {...defaultProps} />);
      
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('should render save button', () => {
      render(<AdminEditPage {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should call onFormChange when input changes', () => {
      const mockOnFormChange = jest.fn();
      
      render(
        <AdminEditPage
          {...defaultProps}
          onFormChange={mockOnFormChange}
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'New Name' } });

      expect(mockOnFormChange).toHaveBeenCalledWith('name', 'New Name');
    });

    it('should call onSave when form is submitted', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      
      render(
        <AdminEditPage
          {...defaultProps}
          onSave={mockOnSave}
          isDirty={true}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(defaultProps.formData);
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state', () => {
      render(
        <AdminEditPage
          {...defaultProps}
          isLoading={true}
        />
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should show save error', () => {
      const saveError = 'Failed to save entity';
      
      render(
        <AdminEditPage
          {...defaultProps}
          saveError={saveError}
        />
      );

      expect(screen.getByText(saveError)).toBeInTheDocument();
    });

    it('should disable save button when saving', () => {
      render(
        <AdminEditPage
          {...defaultProps}
          isSaving={true}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Validation', () => {
    it('should display field errors', () => {
      const errors: ValidationError[] = [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Invalid email format' },
      ];

      render(
        <AdminEditPage
          {...defaultProps}
          errors={errors}
        />
      );

      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });

    it('should disable save button when there are errors', () => {
      const errors: ValidationError[] = [
        { field: 'name', message: 'Name is required' },
      ];

      render(
        <AdminEditPage
          {...defaultProps}
          errors={errors}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Permissions and Actions', () => {
    it('should render delete button when onDelete is provided', () => {
      const mockOnDelete = jest.fn();
      
      render(
        <AdminEditPage
          {...defaultProps}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('should render custom actions', () => {
      const customActions = [
        {
          key: 'custom',
          label: 'Custom Action',
          onClick: jest.fn(),
        },
      ];

      render(
        <AdminEditPage
          {...defaultProps}
          customActions={customActions}
        />
      );

      expect(screen.getByText('Custom Action')).toBeInTheDocument();
    });
  });
}); 