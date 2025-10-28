# Contributing to YouTube Downloader Pro

First off, thank you for considering contributing to YouTube Downloader Pro! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Bug Reports](#bug-reports)
- [Feature Requests](#feature-requests)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what is best for the community
- Show empathy towards others

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, browser, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case** - Why is this enhancement useful?
- **Proposed solution**
- **Alternative solutions** you've considered
- **Mockups or examples** (if applicable)

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:
- `good first issue` - Simple issues for beginners
- `help wanted` - Issues that need attention

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- yt-dlp installed globally
- Git

### Setup Steps

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/youtube-downloader-pro.git
   cd youtube-downloader-pro
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/youtube-downloader-pro.git
   ```

4. **Install dependencies**
   ```bash
   # Install all dependencies
   npm run install:all
   
   # Or manually
   cd backend && npm install
   cd ../client && npm install
   ```

5. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

6. **Start development**
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm start
   
   # Terminal 2: Start frontend
   cd client
   npm run dev
   ```

## 📝 Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint rules
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

```typescript
// Good
const calculateDownloadProgress = (downloaded: number, total: number): number => {
  return Math.round((downloaded / total) * 100);
};

// Bad
const calc = (d, t) => {
  return (d / t) * 100;
};
```

### React Components

- Use functional components with hooks
- Keep components small and reusable
- Use TypeScript interfaces for props
- Add prop validation

```typescript
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};

export default Button;
```

### CSS

- Use CSS variables for colors
- Follow BEM naming convention
- Keep selectors specific
- Add comments for complex styles

```css
/* Good */
.download-item {
  padding: 16px;
  background: var(--yt-bg);
}

.download-item__title {
  font-size: 16px;
  font-weight: 600;
}

.download-item--active {
  border-color: var(--primary);
}
```

### File Structure

```
src/
├── components/          # Reusable components
│   ├── Button.tsx
│   └── Card.tsx
├── pages/              # Page components
│   ├── Home.tsx
│   └── Settings.tsx
├── hooks/              # Custom hooks
│   └── useDownload.ts
├── utils/              # Utility functions
│   └── formatters.ts
├── types/              # TypeScript types
│   └── index.ts
└── styles/             # Global styles
    └── index.css
```

## 📝 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(download): add pause/resume functionality

- Add pause button to download items
- Implement resume logic
- Update progress tracking

Closes #123
```

```bash
fix(ui): correct responsive layout on mobile

- Fix overflow issue on small screens
- Adjust button sizes for touch targets
- Update media queries

Fixes #456
```

## 🔄 Pull Request Process

### Before Submitting

1. **Update your fork**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Test your changes**
   - Run the app locally
   - Test on different browsers
   - Test responsive design
   - Check for console errors

3. **Update documentation**
   - Update README if needed
   - Add comments to code
   - Update CHANGELOG.md

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

### Submitting the PR

1. Go to the original repository
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill in the PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Tested on mobile
- [ ] Tested on different browsers

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Your contribution will be credited

## 🐛 Bug Reports

### Before Submitting

- Check if the bug has already been reported
- Verify it's actually a bug
- Collect information about the bug

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Node Version: [e.g., 18.17.0]
- App Version: [e.g., 1.0.0]

**Additional context**
Any other relevant information.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Mockups, examples, or other relevant information.
```

## 🎨 Design Contributions

### UI/UX Improvements

- Follow the existing design system
- Use the defined color palette
- Maintain consistency
- Consider accessibility
- Test on multiple devices

### Design Assets

- Use SVG for icons
- Optimize images
- Follow naming conventions
- Include source files

## 📚 Documentation Contributions

- Fix typos and grammar
- Improve clarity
- Add examples
- Update outdated information
- Translate to other languages

## 🧪 Testing

### Manual Testing

- Test all features
- Check responsive design
- Verify browser compatibility
- Test keyboard navigation
- Check accessibility

### Automated Testing (Future)

- Write unit tests
- Write integration tests
- Maintain test coverage

## 🏆 Recognition

Contributors will be:
- Listed in CHANGELOG.md
- Credited in README.md
- Mentioned in release notes

## 📞 Getting Help

- **GitHub Issues**: For bugs and features
- **Discussions**: For questions and ideas
- **Email**: your.email@example.com

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to YouTube Downloader Pro! 🎉**

Your contributions make this project better for everyone.
