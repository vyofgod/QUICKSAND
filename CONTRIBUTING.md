# Contributing to DevFocus Dashboard

Thank you for your interest in contributing to DevFocus Dashboard! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/devfocus-dashboard.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit using conventional commits
7. Push and create a Pull Request

## Development Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run db:push

# Run development server
npm run dev
```

## Coding Standards

### TypeScript

- Use strict TypeScript
- Avoid `any` types
- Use type imports: `import { type MyType } from './types'`
- Document complex types

### React

- Use functional components
- Prefer hooks over class components
- Use Server Components when possible
- Keep components small and focused

### Styling

- Use TailwindCSS utility classes
- Follow the existing design system
- Ensure responsive design
- Test dark mode

### Code Quality

```bash
# Lint your code
npm run lint

# Format your code
npm run format

# Type check
npm run type-check

# Run tests
npm run test
```

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

Examples:
```
feat(tasks): add drag-and-drop reordering
fix(auth): resolve session timeout issue
docs(readme): update installation instructions
```

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update the README if needed
5. Request review from maintainers

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added and passing
- [ ] Dependent changes merged

## Testing

### Unit Tests

```bash
npm run test
```

Write tests for:
- Utility functions
- Custom hooks
- Complex components

### E2E Tests

```bash
npm run test:e2e
```

Write E2E tests for:
- Critical user flows
- Authentication
- Data persistence

## Documentation

- Update README for new features
- Add JSDoc comments for functions
- Document API changes
- Include examples

## Questions?

- Open an issue for bugs
- Start a discussion for questions
- Join our Discord community

Thank you for contributing! 🎉
