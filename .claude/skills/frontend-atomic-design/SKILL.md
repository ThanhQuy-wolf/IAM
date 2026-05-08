---
name: frontend-atomic-design
description: Create modern, responsive frontend components and layouts using atomic design methodology with Tailwind CSS. Use this skill whenever building React components, designing UI layouts, creating responsive pages, or working with atomic design principles. Triggers include: component development, page design, responsive design requests, Tailwind CSS styling, creating design systems, building reusable UI elements, or designing for multiple screen sizes (desktop, tablet, mobile). This skill emphasizes reusable variables, modern aesthetics, and responsive design across all viewport sizes.
---

# Atomic Design Frontend System with Tailwind CSS

A comprehensive guide for building modern, responsive frontend applications using atomic design principles and Tailwind CSS.

## Core Principles

### 1. Atomic Design Hierarchy

Atomic Design breaks UI into five distinct levels:

#### **Atoms**
Smallest, indivisible UI elements that cannot be broken down without losing functionality.
- Buttons, input fields, labels, icons, text styles
- Color variables, spacing units, typography scales
- Simple, pure, reusable building blocks

```jsx
// Example: Button Atom
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  Click me
</button>
```

#### **Molecules**
Groups of atoms bonded together, forming simple functional units.
- Search bars (input + button + icon)
- Form fields (label + input + error message)
- Card headers (avatar + title + subtitle)
- Navigation items with icons and labels

```jsx
// Example: Search Molecule
<div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg">
  <SearchIcon className="w-5 h-5 text-gray-500" />
  <input 
    type="text" 
    placeholder="Search..." 
    className="flex-1 outline-none"
  />
</div>
```

#### **Organisms**
Complex functional units made of groups of molecules and/or atoms.
- Header/Navigation bars
- Form sections (multiple form molecules)
- Card layouts with multiple sections
- Modals with title, content, and actions
- Data tables with headers, rows, and pagination

```jsx
// Example: Product Card Organism
<div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
  <img src="image.jpg" className="w-full h-48 object-cover" />
  <div className="p-4">
    <h3 className="font-semibold text-lg">Product Name</h3>
    <p className="text-gray-600 text-sm mt-1">Description</p>
    <div className="flex justify-between items-center mt-4">
      <span className="text-blue-600 font-bold">$99</span>
      <button className="px-3 py-1 bg-blue-600 text-white rounded">Add</button>
    </div>
  </div>
</div>
```

#### **Templates**
Page-level wireframes showing layout and component placement without final content.
- Single-column layouts
- Two-column layouts (sidebar + main)
- Grid-based layouts
- Hero + content sections

#### **Pages**
Specific instances of templates populated with real content and data.
- Homepage with actual products
- User profile with real user data
- Dashboard with live metrics

---

## Design System Variables (Reusable Values)

### Color Palette
```css
/* Define in Tailwind config or use CSS variables */
Primary: #2563eb (blue-600)
Secondary: #7c3aed (violet-600)
Success: #16a34a (green-600)
Warning: #ea580c (orange-600)
Danger: #dc2626 (red-600)
Neutral: #6b7280 (gray-500)
```

### Typography Scale
```css
H1: 32px (2rem) - font-bold
H2: 24px (1.5rem) - font-bold
H3: 20px (1.25rem) - font-semibold
Body: 16px (1rem) - font-normal
Small: 14px (0.875rem) - font-normal
Tiny: 12px (0.75rem) - font-normal
```

### Spacing Scale
```css
xs: 4px (0.25rem)
sm: 8px (0.5rem)
md: 16px (1rem)
lg: 24px (1.5rem)
xl: 32px (2rem)
2xl: 48px (3rem)
```

### Border Radius
```css
Subtle: 4px (rounded-sm)
Standard: 8px (rounded-lg)
Large: 12px (rounded-xl)
Full: 9999px (rounded-full)
```

### Box Shadows
```css
Subtle: 0 1px 2px rgba(0,0,0,0.05)
Soft: 0 4px 6px rgba(0,0,0,0.07)
Medium: 0 10px 15px rgba(0,0,0,0.10)
Strong: 0 20px 25px rgba(0,0,0,0.15)
```

---

## Responsive Design Strategy

### Breakpoints (Tailwind Default)
```
Mobile:   < 640px    (sm)
Tablet:   640px      (md, lg)
Desktop:  1024px+    (xl, 2xl)
```

### Mobile-First Approach
1. **Start with mobile styles** (default, no prefix)
2. **Layer tablet styles** (md: prefix)
3. **Layer desktop styles** (lg:, xl: prefix)

### Example: Responsive Layout
```jsx
// Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} {...item} />
  ))}
</div>
```

### Common Responsive Patterns

**Responsive Typography**
```jsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>
```

**Responsive Padding/Margins**
```jsx
<div className="p-4 md:p-6 lg:p-8">
  Content with responsive spacing
</div>
```

**Responsive Grid**
```jsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
  {/* Grid items */}
</div>
```

**Responsive Flexbox**
```jsx
<div className="flex flex-col md:flex-row gap-4">
  <aside className="w-full md:w-64">Sidebar</aside>
  <main className="flex-1">Main content</main>
</div>
```

**Responsive Images**
```jsx
<img 
  src="image.jpg" 
  className="w-full h-auto object-cover"
  alt="Responsive image"
/>
```

---

## Modern Design Patterns

### 1. Consistency & Visual Hierarchy
- **Use consistent spacing**: Apply spacing scale uniformly
- **Establish clear hierarchy**: Size, weight, color for emphasis
- **Group related content**: Use whitespace to separate sections
- **Align elements**: Use grids for crisp layouts

```jsx
<section className="space-y-6">
  <div>
    <h2 className="text-2xl font-bold mb-2">Section Title</h2>
    <p className="text-gray-600">Description text</p>
  </div>
  <div className="space-y-4">
    {/* Related items with consistent spacing */}
  </div>
</section>
```

### 2. Interactive Feedback
- **Hover states**: Subtle color/shadow changes
- **Active states**: Indicate current selection
- **Focus states**: Keyboard navigation support
- **Loading states**: Spinners or skeleton screens
- **Transitions**: Smooth animations (200-300ms)

```jsx
<button className="
  px-4 py-2 bg-blue-600 text-white rounded-lg
  hover:bg-blue-700
  active:scale-95
  focus:outline-none focus:ring-2 focus:ring-blue-500
  transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Actionable Button
</button>
```

### 3. Depth & Layering
- **Subtle shadows**: Create depth without heaviness
- **Elevation levels**: Consistent shadow progression
- **Overlays**: Semi-transparent backgrounds for modals
- **Z-index strategy**: Clear layering hierarchy

```jsx
<div className="
  border border-gray-200 rounded-lg
  shadow-sm hover:shadow-md
  transition-shadow duration-300
">
  Card content
</div>
```

### 4. Color Usage
- **Primary action**: Most frequent call-to-action
- **Secondary action**: Alternative actions
- **Semantic colors**: Status indicators (success, warning, danger)
- **Contrast**: Ensure WCAG AA compliance (4.5:1 ratio)
- **Limited palette**: 3-5 colors maximum in most designs

### 5. Whitespace & Breathing Room
- Don't crowd elements
- Use consistent gap values (gap-4, gap-6, gap-8)
- Separate sections with vertical rhythm
- Generous padding in cards and containers

```jsx
<div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
  <div className="space-y-8">
    {/* Sections with good breathing room */}
  </div>
</div>
```

---

## Tailwind CSS Best Practices

### 1. Use Utility Classes Effectively
```jsx
// Good: Semantic, reusable, organized
<button className="
  px-4 py-2
  bg-blue-600 text-white
  rounded-lg
  hover:bg-blue-700
  transition-colors
  disabled:opacity-50
">
  Submit
</button>

// Avoid: Too many utilities, hard to read
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
```

### 2. Extract Reusable Components
```jsx
// Create a Button component to avoid repetition
const Button = ({ children, variant = 'primary', ...props }) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  
  return (
    <button className={`${baseStyles} ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
};
```

### 3. Organize Utility Classes
```jsx
// Organize by category: layout → sizing → colors → effects → responsive
<div className="
  /* Layout */
  flex flex-col gap-4
  /* Sizing */
  w-full max-w-2xl
  /* Spacing */
  p-6 my-8
  /* Colors & text */
  bg-white text-gray-900
  /* Borders & shadows */
  border border-gray-200 rounded-lg shadow-sm
  /* Effects */
  hover:shadow-md transition-shadow
  /* Responsive */
  md:flex-row lg:gap-6
">
</div>
```

### 4. Use Tailwind Config for Consistency
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#7c3aed',
      },
      spacing: {
        gutter: '1rem',
      },
    },
  },
};
```

---

## Component Construction Template

Use this template when building atomic components:

```jsx
/**
 * {Component Name}
 * 
 * Atoms/Molecules/Organisms level component
 * Purpose: [Brief description]
 * 
 * Props:
 *   - prop1: type - description
 *   - prop2: type - description
 */

export const ComponentName = ({ prop1, prop2, className = '' }) => {
  return (
    <div className={`
      /* Base styles */
      flex flex-col gap-4 p-6
      bg-white border border-gray-200 rounded-lg
      /* Responsive */
      md:flex-row lg:p-8
      /* Custom className */
      ${className}
    `}>
      {/* Component content */}
    </div>
  );
};
```

---

## Layout Patterns

### Container + Padding
```jsx
<div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
  {/* Content constrained to max width with responsive padding */}
</div>
```

### Two-Column Sidebar Layout
```jsx
<div className="flex flex-col lg:flex-row gap-6">
  <aside className="w-full lg:w-64 flex-shrink-0">
    {/* Sidebar: full width on mobile, fixed on desktop */}
  </aside>
  <main className="flex-1 min-w-0">
    {/* Main content: takes remaining space */}
  </main>
</div>
```

### Responsive Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Items automatically stack on mobile, 2 columns on tablet, 3 on desktop */}
</div>
```

### Hero Section
```jsx
<section className="relative bg-gradient-to-r from-blue-600 to-violet-600 text-white overflow-hidden py-12 md:py-20 lg:py-32">
  <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">
    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
      Hero Title
    </h1>
    <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl">
      Hero subtitle or description
    </p>
    <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
      Call to Action
    </button>
  </div>
</section>
```

---

## Accessibility & Best Practices

1. **Semantic HTML**: Use `<button>`, `<a>`, `<form>`, etc. appropriately
2. **Color contrast**: Ensure 4.5:1 for text, 3:1 for UI components
3. **Focus states**: Always visible keyboard navigation (`focus:ring-2`)
4. **ARIA labels**: Add when needed (`aria-label`, `aria-describedby`)
5. **Responsive text**: Use relative sizing, not fixed pixels
6. **Touch targets**: Minimum 44x44px for interactive elements

```jsx
<button 
  className="px-4 py-3 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-offset-2"
  aria-label="Close modal"
>
  ✕
</button>
```

---

## Performance Considerations

1. **Limit custom CSS**: Rely on Tailwind utilities
2. **Tree-shake unused styles**: Configure Tailwind content paths
3. **Optimize images**: Use responsive images, WebP format
4. **Lazy load**: Defer non-critical components
5. **Minimize bundle**: Use PurgeCSS in production

---

## Quick Reference Checklist

When building a component, ensure:
- [ ] Follows atomic design hierarchy (Atom/Molecule/Organism)
- [ ] Uses design system variables (colors, spacing, typography)
- [ ] Responsive across mobile, tablet, desktop
- [ ] Consistent hover/active/focus states
- [ ] Proper whitespace and visual hierarchy
- [ ] Semantic HTML structure
- [ ] Accessible (contrast, focus, labels)
- [ ] Mobile-first approach
- [ ] No hardcoded values (use Tailwind config)

