dev:
	docker-compose -f docker-compose.development.yml  up --build

start:
	docker-compose -f docker-compose.production.yml  up --build -d

PHONY: dev start
