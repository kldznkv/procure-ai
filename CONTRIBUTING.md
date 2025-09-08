# Contributing to ProcureAI

Thank you for your interest in contributing to ProcureAI! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

1. **Check existing issues** - Search for similar issues before creating a new one
2. **Use the issue template** - Provide clear description, steps to reproduce, and expected behavior
3. **Include environment details** - OS, Node.js version, browser, etc.
4. **Add screenshots** - Visual evidence helps with debugging

### Suggesting Features

1. **Check the roadmap** - See if your feature is already planned
2. **Open a discussion** - Use GitHub Discussions for feature requests
3. **Provide use cases** - Explain why this feature would be valuable
4. **Consider implementation** - Think about how it might be implemented

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Add tests** (if applicable)
5. **Update documentation**
6. **Submit a pull request**

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- npm 8+
- Git
- Supabase account (for testing)
- Anthropic API key (for AI features)

### Local Development

1. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/procure-ai.git
   cd procure-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp env.example .env.local
   # Fill in your environment variables
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 📋 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper interfaces and types
- Avoid `any` type - use specific types
- Use strict type checking

### React/Next.js

- Use functional components with hooks
- Follow Next.js 13+ app directory structure
- Use proper error boundaries
- Implement proper loading states

### API Routes

- Use consistent response format:
  ```typescript
  {
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
  }
  ```
- Implement proper error handling
- Add input validation
- Use appropriate HTTP status codes

### Database

- Use Supabase client properly
- Implement Row Level Security (RLS)
- Use transactions for complex operations
- Add proper error handling

## 🧪 Testing

### Running Tests

```bash
# Lint code
npm run lint

# Type check
npm run type-check

# Build test
npm run build
```

### Writing Tests

- Test critical business logic
- Test API endpoints
- Test error scenarios
- Test edge cases

## 📝 Documentation

### Code Documentation

- Add JSDoc comments for functions
- Document complex logic
- Update README for new features
- Keep API documentation current

### Commit Messages

Use conventional commit format:

```
type(scope): description

feat(api): add document processing endpoint
fix(ui): resolve upload button styling
docs(readme): update installation instructions
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 🔍 Code Review Process

### For Contributors

1. **Self-review** - Check your own code before submitting
2. **Test thoroughly** - Ensure all functionality works
3. **Update documentation** - Keep docs current
4. **Respond to feedback** - Address review comments promptly

### For Reviewers

1. **Check functionality** - Ensure code works as intended
2. **Review security** - Look for security vulnerabilities
3. **Check performance** - Ensure no performance regressions
4. **Verify tests** - Ensure adequate test coverage
5. **Check documentation** - Ensure docs are updated

## 🚫 What Not to Contribute

- Code that breaks existing functionality
- Features without proper documentation
- Code that doesn't follow project standards
- Security vulnerabilities
- Code without proper error handling

## 🐛 Bug Reports

When reporting bugs, include:

1. **Clear title** - Brief description of the issue
2. **Steps to reproduce** - Detailed steps to recreate the bug
3. **Expected behavior** - What should happen
4. **Actual behavior** - What actually happens
5. **Environment** - OS, Node.js version, browser, etc.
6. **Screenshots** - Visual evidence if applicable
7. **Logs** - Error messages or console output

## 💡 Feature Requests

When suggesting features:

1. **Clear description** - What the feature should do
2. **Use cases** - Why this feature is needed
3. **Implementation ideas** - How it might be implemented
4. **Alternatives** - Other ways to solve the problem
5. **Impact** - Who would benefit from this feature

## 📞 Getting Help

- **GitHub Discussions** - For questions and discussions
- **GitHub Issues** - For bug reports and feature requests
- **Discord** - For real-time chat (if available)
- **Email** - For security issues (if available)

## 🏆 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Project documentation
- GitHub contributors page

## 📄 License

By contributing to ProcureAI, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You

Thank you for contributing to ProcureAI! Your contributions help make procurement management more efficient and intelligent for everyone.

---

**Happy Contributing! 🚀**
