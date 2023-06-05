![musicpad logo](https://i.imgur.com/YnWT1Hb.png)

Musicpad, A collaborative music listening platform

Other Musicpad Repos:

- [Musicpad Frontend](https://github.com/musicpadnet/musicpad-frontend)
- [Musicpad Websocket](https://github.com/musicpadnet/musicpad-websocket)

## Preview of what it looks like
![Preview](https://i.imgur.com/wjc81Gs.png)

## Prerequisites

You'll need to install docker and docker compose to run the application as it needs to pull down the mongo image.

You can install docker desktop [Here](https://www.docker.com/products/docker-desktop)

Nodejs 18.14. install node [Here](https://nodejs.org/en/download/)

Make sure you can build native packages.

## Development

Make sure to run `npm install` in the directory.

To run the development application all you have to do is run `docker-compose up --build`

Make sure to make a pull request when commiting.

## Production

you'll want to use k8s to run this in production.
