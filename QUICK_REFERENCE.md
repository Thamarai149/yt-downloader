# 🚀 Grand Design - Quick Reference Card

## 🎨 Most Used Classes

### Containers
```html
<div class="grand-card">              <!-- Glass card -->
<div class="grand-card-gradient">     <!-- Gradient border card -->
```

### Buttons
```html
<button class="grand-btn grand-btn-primary">    <!-- Primary action -->
<button class="grand-btn grand-btn-secondary">  <!-- Secondary action -->
<button class="grand-btn grand-btn-accent">     <!-- Accent action -->
<button class="grand-btn grand-btn-glass">      <!-- Glass button -->
```

### Inputs
```html
<input class="grand-input">                     <!-- Standard input -->
<div class="grand-input-icon">                  <!-- Input with icon -->
```

### Layout
```html
<div class="grand-flex grand-gap-4">            <!-- Flex with gap -->
<div class="grand-flex-center">                 <!-- Centered flex -->
<div class="grand-flex-between">                <!-- Space between -->
<div class="grand-grid grand-grid-3">           <!-- 3 column grid -->
```

## 🎯 Common Patterns

### Form Section
```html
<div class="grand-card">
  <div class="grand-section-header">
    <div class="grand-section-icon">📥</div>
    <h2 class="grand-section-title">Title</h2>
  </div>
  
  <div class="grand-input-group">
    <label class="grand-input-label">Label</label>
    <input class="grand-input" placeholder="...">
  </div>
  
  <button class="grand-btn grand-btn-primary grand-w-full">
    Submit
  </button>
</div>
```

### Stats Dashboard
```html
<div class="grand-stats-grid">
  <div class="grand-stat-card">
    <div class="grand-stat-icon">📊</div>
    <div class="grand-stat-value">1,234</div>
    <div class="grand-stat-label">Label</div>
  </div>
</div>
```

### Download Item
```html
<div class="grand-download-item">
  <div class="grand-download-header">
    <img class="grand-download-thumbnail" src="...">
    <div class="grand-download-info">
      <h4 class="grand-download-title">Title</h4>
      <div class="grand-download-meta">
        <span>Meta 1</span>
        <span>Meta 2</span>
      </div>
    </div>
  </div>
  
  <div class="grand-progress-container">
    <div class="grand-progress-bar">
      <div class="grand-progress-fill" style="width: 75%"></div>
    </div>
  </div>
</div>
```

### Tab Navigation
```html
<div class="grand-tabs">
  <button class="grand-tab active">
    <span class="grand-tab-icon">📥</span>
    <span class="grand-tab-text">Tab 1</span>
  </button>
  <button class="grand-tab">
    <span class="grand-tab-icon">🔍</span>
    <span class="grand-tab-text">Tab 2</span>
  </button>
</div>
```

## 🎨 Color Variables

```css
--grand-primary: #667eea
--grand-secondary: #f093fb
--grand-accent: #4facfe

--gradient-primary: linear-gradient(135deg, #667eea, #764ba2)
--gradient-secondary: linear-gradient(135deg, #f093fb, #f5576c)
--gradient-accent: linear-gradient(135deg, #4facfe, #00f2fe)
```

## 📏 Spacing Scale

```css
--space-2: 0.5rem    (8px)
--space-3: 0.75rem   (12px)
--space-4: 1rem      (16px)
--space-6: 1.5rem    (24px)
--space-8: 2rem      (32px)
```

## 🎭 Utility Classes

### Spacing
```html
grand-mb-4    <!-- Margin bottom -->
grand-mt-6    <!-- Margin top -->
grand-p-8     <!-- Padding all -->
grand-gap-4   <!-- Gap between -->
```

### Layout
```html
grand-flex           <!-- Flexbox -->
grand-flex-center    <!-- Center items -->
grand-flex-between   <!-- Space between -->
grand-flex-col       <!-- Column direction -->
grand-w-full         <!-- Full width -->
```

### Effects
```html
grand-hover-lift     <!-- Lift on hover -->
grand-hover-scale    <!-- Scale on hover -->
grand-hover-glow     <!-- Glow on hover -->
```

## 🌓 Theme Toggle

```javascript
// Toggle theme
const html = document.documentElement;
html.setAttribute('data-theme', 'dark'); // or 'light'
```

```tsx
// React example
<div data-theme={darkMode ? 'dark' : 'light'}>
```

## 📱 Responsive Classes

All components are responsive by default!

Breakpoints:
- Desktop: > 1024px
- Tablet: 768-1024px
- Mobile: < 768px
- Small: < 480px

## ⚡ Quick Tips

1. **Always use grand-card** for main content
2. **Use grand-btn-primary** for main actions
3. **Add grand-gap-4** for consistent spacing
4. **Use grand-flex-between** for headers
5. **Apply grand-hover-lift** for cards
6. **Use grand-w-full** for full-width elements
7. **Add grand-mb-6** for section spacing
8. **Use grand-stats-grid** for metrics
9. **Apply grand-section-header** for sections
10. **Use grand-empty-state** for no data

## 🎯 Common Combinations

### Primary Action Button
```html
<button class="grand-btn grand-btn-primary grand-w-full">
  Download Now
</button>
```

### Card with Header
```html
<div class="grand-card grand-hover-lift">
  <div class="grand-flex-between grand-mb-4">
    <h3>Title</h3>
    <span class="grand-badge grand-badge-success">Active</span>
  </div>
  <!-- Content -->
</div>
```

### Input with Icon
```html
<div class="grand-input-group grand-input-icon">
  <label class="grand-input-label">URL</label>
  <span class="grand-input-icon-left">🔗</span>
  <input class="grand-input" placeholder="Enter URL">
</div>
```

### Stat Card
```html
<div class="grand-stat-card grand-hover-lift">
  <div class="grand-stat-icon">📊</div>
  <div class="grand-stat-value">1,234</div>
  <div class="grand-stat-label">Downloads</div>
</div>
```

## 📚 Files Reference

- **Design System**: `client/src/grand-design.css`
- **Full Guide**: `GRAND_DESIGN_GUIDE.md`
- **Migration**: `MIGRATION_GUIDE.md`
- **Comparison**: `DESIGN_COMPARISON.md`
- **Demo**: `client/grand-design-demo.html`

## 🆘 Need Help?

1. Check `GRAND_DESIGN_GUIDE.md` for detailed docs
2. View `client/grand-design-demo.html` for examples
3. Read `MIGRATION_GUIDE.md` for class mappings
4. See `DESIGN_COMPARISON.md` for improvements

---

**Print this and keep it handy! 📌**
