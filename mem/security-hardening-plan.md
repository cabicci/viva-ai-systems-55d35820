---
name: Security hardening plan
description: Pre-launch security hardening checklist — done items + next steps
type: feature
---
# Security Hardening Plan

## Done
1. ✅ Tests on critical paths (vitest, 30 tests passing — curriculum, unified-lessons, entitlements)
2. ✅ Lightweight error monitoring (client_error_logs table + logClientError serverFn + reportToServer in error-capture.ts)

## Next (start at #3 when user says "نكمل تامين النظام")
3. Rate limiting (server functions: AI eval, error logs, mission submit)
4. Admin dashboard to read client_error_logs
5. Input validation audit on all server functions
6. Auth hardening (HIBP leaked password check, session config)
7. RLS policy audit
8. Secrets rotation review
