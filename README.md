# Musicpad Core
Musicpad, A collaborative music listening platform

### Prerequisites

You'll need to install docker and docker compose to run the application as it needs to pull down the mongo image.

You can install docker desktop [Here](https://www.docker.com/products/docker-desktop)

Nodejs 18.14. install node [Here](https://nodejs.org/en/download/)

Make sure you can build native packages.

### Development

Make sure to run `npm install` in the directory.

To run the development application all you have to do is run `docker-compose up --build`

Make sure to make a pull request when commiting.

### Production

you'll want to use k8s to run this in production.
