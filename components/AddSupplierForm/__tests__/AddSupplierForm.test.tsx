import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddSupplierForm from '../index';
import { Alert } from 'react-native';

jest.mock('@/components/ImageHandler', () => {
  return function MockImageHandler() {
    return null;
  };
});

jest.mock('@/lib/theme', () => ({
  useTheme: () => ({
    colors: {
      background: '#fff',
      text: '#111',
      textSecondary: '#666',
      primary: '#2f855a',
      primaryText: '#fff',
      inputBackground: '#fff',
      inputText: '#111',
      inputBorder: '#ddd',
      error: '#e53e3e',
      border: '#ddd',
      buttonText: '#fff',
      surface: '#f7fafc',
      icon: '#111',
      modalBackground: 'rgba(0,0,0,0.5)',
    },
  }),
}));

const mockGetUser = jest.fn();
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn(() => ({
  insert: mockInsert,
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockInsert.mockReturnValue({ select: mockSelect });
  mockSelect.mockReturnValue({ single: mockSingle });
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-1' } },
    error: null,
  });
  mockSingle.mockResolvedValue({
    data: { id: 'supplier-1', supplier_name: 'Test Supplier' },
    error: null,
  });
});

describe('AddSupplierForm', () => {
  it('validates required supplier name', async () => {
    const { getByText } = render(<AddSupplierForm />);

    fireEvent.press(getByText('Add Supplier'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Supplier name is required.');
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('shows invalid email message and blocks submit', async () => {
    const { getByText, getByPlaceholderText, findAllByText } = render(<AddSupplierForm />);

    fireEvent.changeText(getByPlaceholderText('Enter Supplier Name'), 'SeedCo');
    fireEvent.changeText(getByPlaceholderText('Enter email address'), 'bad-email');
    fireEvent.press(getByText('Add Supplier'));

    const invalidMessages = await findAllByText('Invalid email address');
    expect(invalidMessages.length).toBeGreaterThan(0);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('submits valid data and calls onSuccess', async () => {
    const onSuccess = jest.fn();
    const { getByText, getByPlaceholderText } = render(<AddSupplierForm onSuccess={onSuccess} />);

    fireEvent.changeText(getByPlaceholderText('Enter Supplier Name'), 'SeedCo');
    fireEvent.changeText(getByPlaceholderText('Enter email address'), 'info@seedco.com');
    fireEvent.press(getByText('Add Supplier'));

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('suppliers');
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
