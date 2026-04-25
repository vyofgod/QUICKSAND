# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of DevFocus Dashboard seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:

- Open a public GitHub issue
- Disclose the vulnerability publicly before it has been addressed

### Please DO:

1. **Email us directly** at security@devfocus.dev with:
   - A description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Suggested fix (if any)

2. **Allow us time** to respond and address the issue before public disclosure

3. **Act in good faith** towards our users' privacy and data

## What to Expect

- **Acknowledgment**: We'll acknowledge receipt of your vulnerability report within 48 hours
- **Updates**: We'll keep you informed about our progress
- **Timeline**: We aim to address critical vulnerabilities within 7 days
- **Credit**: We'll credit you in our security advisory (unless you prefer to remain anonymous)

## Security Best Practices

When deploying DevFocus Dashboard:

### Environment Variables
- Never commit `.env` files to version control
- Use strong, randomly generated secrets
- Rotate secrets regularly
- Use different secrets for different environments

### Database
- Use strong database passwords
- Enable SSL/TLS for database connections
- Regularly backup your database
- Keep PostgreSQL updated

### Authentication
- Use OAuth providers (GitHub/GitLab)
- Enable 2FA on your OAuth accounts
- Regularly review authorized applications
- Set appropriate session timeouts

### API Keys
- Store API keys securely in environment variables
- Use API key rotation when available
- Monitor API usage for anomalies
- Revoke unused API keys

### Deployment
- Use HTTPS in production
- Enable security headers
- Keep dependencies updated
- Monitor for security advisories
- Use a Web Application Firewall (WAF)

### Code Security
- Run `npm audit` regularly
- Keep dependencies updated
- Use Dependabot for automated updates
- Review code changes carefully
- Enable branch protection rules

## Security Features

DevFocus Dashboard includes several security features:

### Input Validation
- Zod schema validation for all inputs
- SQL injection prevention via Prisma
- XSS protection via React
- CSRF protection via NextAuth

### Authentication
- Secure session management
- Database session storage
- OAuth 2.0 implementation
- Automatic session expiration

### Authorization
- User-scoped data access
- Protected API routes
- Row-level security
- Role-based access control (planned)

### Data Protection
- Encrypted database connections
- Secure password hashing (OAuth only)
- Environment variable validation
- Secure cookie settings

## Known Security Considerations

### OAuth Tokens
- OAuth access tokens are stored in the database
- Tokens are encrypted at rest
- Tokens are never exposed to the client
- Tokens are automatically refreshed when possible

### Offline Data
- Offline data is stored in IndexedDB
- IndexedDB is origin-isolated
- Sensitive data should not be cached offline
- Clear offline data on sign out

### AI Integration
- AI prompts may contain sensitive information
- Review AI provider's privacy policy
- Consider data residency requirements
- Implement prompt filtering if needed

## Compliance

DevFocus Dashboard is designed with privacy and security in mind:

- **GDPR**: User data can be exported and deleted
- **CCPA**: Users have control over their data
- **SOC 2**: Following security best practices
- **OWASP**: Addressing top 10 security risks

## Security Updates

We regularly update dependencies and address security issues:

- **Automated**: Dependabot for dependency updates
- **Manual**: Regular security audits
- **Monitoring**: GitHub Security Advisories
- **Testing**: Automated security testing in CI/CD

## Contact

For security concerns, contact:
- Email: security@devfocus.dev
- PGP Key: [Available on request]

For general questions:
- GitHub Issues: https://github.com/yourusername/devfocus-dashboard/issues
- Discord: https://discord.gg/devfocus

## Acknowledgments

We thank the following security researchers for responsibly disclosing vulnerabilities:

- [Your name could be here!]

---

Last updated: April 24, 2026
