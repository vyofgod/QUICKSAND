.PHONY: help install dev build start test lint format clean docker-up docker-down

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm install

dev: ## Start development server
	npm run dev

quick-start: ## Start development server with SurrealDB
	npm run quick-start

build: ## Build for production
	npm run build

start: ## Start production server
	npm run start

test: ## Run tests
	npm run test

test-e2e: ## Run E2E tests
	npm run test:e2e

lint: ## Run linter
	npm run lint

lint-fix: ## Fix linting issues
	npm run lint:fix

format: ## Format code
	npm run format

type-check: ## Check TypeScript types
	npm run type-check

db-push: ## Push database schema
	npm run db:push

db-migrate: ## Run database migrations
	npm run db:migrate

db-studio: ## Open Prisma Studio
	npm run db:studio

clean: ## Clean build artifacts
	rm -rf .next out node_modules

docker-up: ## Start Docker containers
	docker-compose up -d

docker-down: ## Stop Docker containers
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

setup: ## Run setup script
	chmod +x scripts/setup.sh
	./scripts/setup.sh
