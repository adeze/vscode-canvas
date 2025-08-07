# Contributing to Infinite Canvas

🎉 Thank you for your interest in contributing to Infinite Canvas! We welcome contributions from the community.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- VS Code (for testing)
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/infinite_canvas_vscode.git
   cd infinite_canvas_vscode
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Extension**
   ```bash
   npm run compile
   ```

4. **Test the Extension**
   - Press `F5` in VS Code to launch Extension Development Host
   - Create a `.canvas` file to test functionality

## 📋 How to Contribute

### 🐛 Bug Reports
1. Search existing issues to avoid duplicates
2. Use the bug report template
3. Include steps to reproduce, expected vs actual behavior
4. Add screenshots/GIFs if helpful

### ✨ Feature Requests
1. Check if the feature has been requested before
2. Use the feature request template
3. Describe the use case and expected behavior
4. Consider implementation complexity

### 🛠️ Code Contributions

#### Pull Request Process
1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation

3. **Test Thoroughly**
   - Test in Extension Development Host
   - Verify no regressions
   - Test edge cases

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

#### Code Style Guidelines
- Use TypeScript for extension code
- Use modern JavaScript (ES6+) for webview code
- Follow existing indentation (2 spaces)
- Use meaningful variable and function names
- Add comments for complex logic

#### Commit Message Format
```
type: short description

Optional longer description

Fixes #issue-number
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 🧪 Testing

### Manual Testing Checklist
- [ ] Extension loads without errors
- [ ] Canvas files open correctly
- [ ] Node creation and editing works
- [ ] AI generation functions (if API key provided)
- [ ] Markdown rendering displays properly
- [ ] File drag & drop works
- [ ] Navigation (pan/zoom) is smooth
- [ ] Keyboard shortcuts work
- [ ] Auto-save functions correctly

### Test Cases to Cover
1. **Basic Functionality**
   - Create, edit, delete nodes
   - Pan and zoom canvas
   - Save and load canvas files

2. **AI Features**
   - Generate ideas with different models
   - Context-aware generation
   - Fallback to mock responses

3. **Markdown Support**
   - All heading levels (# ## ### #### ##### ######)
   - Bold and italic formatting
   - List rendering
   - Line break preservation

4. **File Integration**
   - Drag & drop files to canvas
   - Edit markdown files inline
   - Auto-save changes

## 🏗️ Project Structure

```
├── src/
│   └── extension.ts          # Main extension entry point
├── webview/
│   ├── src/
│   │   ├── InfiniteCanvasSimple.js  # Main canvas implementation
│   │   ├── AIManager.js             # AI integration
│   │   └── aiService.js             # AI service layer
│   ├── style.css            # Canvas styling
│   └── main.js             # Webview entry point
├── package.json            # Extension manifest
└── README.md
```

## 🎯 Areas for Contribution

### High Priority
- 🐛 Bug fixes and stability improvements
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- ⚡ Performance optimizations

### Medium Priority
- 🧪 Test coverage expansion
- 🌐 Internationalization (i18n)
- 📱 Accessibility improvements
- 🔍 Search functionality

### Future Features
- 📊 Additional node types (images, code blocks)
- 🎨 Theme customization
- 🔄 Real-time collaboration
- 📈 Analytics integration

## ❓ Need Help?

- 💬 [Discussions](https://github.com/lout33/infinite_canvas_vscode/discussions) - General questions and ideas
- 🐛 [Issues](https://github.com/lout33/infinite_canvas_vscode/issues) - Bug reports and feature requests
- 📧 Email: [contribute@infinite-canvas.dev](mailto:contribute@infinite-canvas.dev)

## 📜 Code of Conduct

Please be respectful and inclusive in all interactions. We want this to be a welcoming community for everyone.

## 🎉 Recognition

Contributors will be acknowledged in:
- README.md contributors section
- Release notes for significant contributions
- Annual contributor recognition

Thank you for helping make Infinite Canvas better! 🚀