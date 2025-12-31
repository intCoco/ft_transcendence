NAME = transcendence

all: up	

up:
# 	mkdir -p /home/$(USER)/data/backend
# 	mkdir -p /home/$(USER)/data/mariadb
	docker compose -f ./app/docker-compose.yml up -d --build

down:
	docker compose -f ./app/docker-compose.yml down

clean:
	docker compose -f ./app/docker-compose.yml down -v
# 	sudo chown -R $(USER):$(USER) /home/$(USER)/data
# 	rm -rf /home/$(USER)/data/backend
# 	rm -rf /home/$(USER)/data/mariadb

fclean: clean
	docker image prune -af
	docker volume prune -f

re: fclean all

.PHONY: all up down clean fclean re