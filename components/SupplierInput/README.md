# SupplierInput Component

A unified autocomplete input component for selecting suppliers with inline creation capability.

## Features

- **Autocomplete Search**: Type to search suppliers by name with debounced filtering
- **Inline Supplier Creation**: Add new suppliers directly from the dropdown when no matches are found
- **Touch-Optimized**: Proper touch handling for mobile devices using TouchableOpacity
- **Keyboard-Friendly**: Supports keyboard navigation and prevents interference with touch events
- **Outside Tap Handling**: Click/tap outside the dropdown to close it
- **Loading States**: Shows loading indicator while fetching suppliers
- **Error Handling**: Graceful error handling for database operations

## Usage

```tsx
import { SupplierInput } from '@/components/SupplierInput';

// Basic usage
<SupplierInput
  onSelect={handleSupplierSelect}
  selectedSupplier={selectedSupplier}
  placeholder="Type supplier name..."
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onSelect` | `(supplier: Supplier) => void` | ✅ | Callback fired when a supplier is selected |
| `selectedSupplier` | `Supplier \| null` | ❌ | Currently selected supplier object |
| `placeholder` | `string` | ❌ | Placeholder text for the input field |

## Supplier Type

The component expects suppliers to have the following structure:

```typescript
interface Supplier {
  id: string;
  supplier_name: string;
  address?: string;
  phone?: string;
  email?: string;
  webaddress?: string;
  notes?: string;
  is_active: boolean;
  // ... other fields
}
```

## Behavior

### Search and Filtering
- **Debounced Search**: 300ms delay to prevent excessive API calls
- **Multi-word Search**: Supports searching multiple words (e.g., "Baker Creek" matches "Baker Creek Heirloom Seeds")
- **Case Insensitive**: Search is case-insensitive
- **Real-time Filtering**: Results update as you type

### Dropdown Management
- **Auto-show**: Dropdown appears when typing and results are found
- **Manual Close**: Dropdown stays open until:
  - User selects a supplier
  - User taps outside the dropdown
  - User clears the input field
- **No Auto-close on Blur**: Input blur doesn't automatically close dropdown to prevent touch interference

### Touch Handling
- **TouchableOpacity**: Uses TouchableOpacity for better mobile touch response
- **Pointer Events**: Proper pointer event handling to prevent touch conflicts
- **Keyboard Persistence**: `keyboardShouldPersistTaps="handled"` ensures keyboard doesn't interfere
- **Overlay Detection**: Invisible overlay detects taps outside the dropdown

### Supplier Creation
- **Inline Creation**: When no suppliers match the search, shows "Add new supplier" option
- **Modal Form**: Opens a modal with AddSupplierForm component
- **Auto-selection**: Newly created suppliers are automatically selected
- **List Refresh**: Supplier list is refreshed after creation

## Implementation Details

### Key Features Fixed
1. **Touch Event Handling**: Replaced Pressable with TouchableOpacity for better mobile compatibility
2. **Blur Prevention**: Removed automatic dropdown closing on input blur
3. **Pointer Events**: Added proper `pointerEvents` configuration
4. **Overlay Tap**: Added overlay for detecting outside taps
5. **Keyboard Handling**: Added `blurOnSubmit={false}` and `keyboardShouldPersistTaps`

### State Management
- `inputValue`: Controlled input text state
- `suppliers`: Full list of active suppliers from database
- `filteredSuppliers`: Filtered results based on search query
- `showDropdown`: Controls dropdown visibility
- `isLoading`: Loading state for database operations
- `showAddModal`: Controls new supplier modal visibility

### Database Integration
- Fetches suppliers from Supabase `suppliers` table
- Filters by `is_active = true`
- Orders by `supplier_name`
- Real-time search with debounced queries

## Styling

The component uses StyleSheet with the following key styles:

- **Container**: Relative positioning with z-index for proper layering
- **Dropdown**: Absolute positioning with elevation and shadow
- **Overlay**: Full-screen invisible overlay for outside tap detection
- **Touch Areas**: Proper padding and touch targets for mobile

## Error Handling

- Database connection errors are logged to console
- Invalid supplier data shows user-friendly alerts
- Loading states prevent user interaction during operations
- Graceful fallbacks for missing or malformed data

## Dependencies

- `react-native`: Core React Native components
- `@supabase/supabase-js`: Database integration
- `lucide-react-native`: Icons (Building2, Check, Plus, X)
- `@/utils/debounce`: Debouncing utility
- `@/components/AddSupplierForm`: Supplier creation form

## Notes

- Component is optimized for mobile touch interfaces
- Requires proper Supabase configuration and authentication
- Uses TypeScript for type safety
- Follows React Native best practices for performance
