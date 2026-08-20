# Contributing

## Before changing code

1. Create a short-lived branch from `main`.
2. Keep frontend work inside `frontend` and API work inside `backend`.
3. Update the OpenAPI contract when an HTTP request or response changes.
4. Add or update tests for validation, authorization, storage, and database behavior.

## Before opening a pull request

Run the frontend type check, lint, and production build, then run Go tests and `go vet`. Do not commit generated folders, local databases, uploads, `.env` files, or credentials.

Pull requests should explain the user-visible outcome, database or environment changes, verification performed, and rollback considerations.
