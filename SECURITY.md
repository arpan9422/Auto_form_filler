# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| main (latest) | Yes |
| Older branches | No |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in FormPilot, **please do not open a public GitHub issue**.

Instead, please report it privately by emailing the maintainers directly or by using [GitHub private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability) if enabled on this repository.

### What to include in your report

- A description of the vulnerability and its potential impact
- Step-by-step instructions to reproduce the issue
- Any proof-of-concept code if applicable
- Versions or branches affected

### What to expect

- We will acknowledge receipt of your report within **48 hours**
- We will provide an estimated timeline for a fix within **5 business days**
- We will notify you when the fix is released
- We will credit you in the release notes (unless you prefer to remain anonymous)

## Security Best Practices for Self-Hosted Deployments

If you are self-hosting FormPilot, please follow these recommendations:

### Environment Variables
- Never commit `.env` files to version control
- Use strong, randomly generated values for all JWT secrets (`JWT_SECRET`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`)
- Rotate secrets periodically

### API Keys
- Use scoped OpenAI API keys with usage limits set in the OpenAI dashboard
- Restrict AWS IAM permissions to only the S3 bucket used by FormPilot
- Never expose your backend API publicly without authentication

### Database
- Run PostgreSQL with a non-default password (not `password123` from the example)
- Do not expose PostgreSQL port 5432 publicly
- Enable SSL for database connections in production

### JWT Tokens
- The default access token expiry is 15 minutes — do not increase this significantly
- Implement token rotation if deploying to production

### Chrome Extension
- The extension requests `<all_urls>` host permission to inject content scripts on any page
- Review the `manifest.json` permissions carefully before distributing in a production setting

## Known Limitations

- This project is primarily a development/personal tool and has not undergone a formal security audit
- ChromaDB is run without authentication by default — do not expose it publicly
- API rate limiting is not implemented — add it before public deployment
