![Mixzy logo](https://i.imgur.com/kAKMfIW.png)

Other Mixzy Repos:

- [Mixzy Frontend](https://github.com/mixzyhq/mixzy-frontend)
- [Mixzy Websocket](https://github.com/mixzyhq/mixzy-websocket)

## Preview of what it looks like
![Preview](https://i.imgur.com/lZlxO1Y.png)

## Prerequisites

You'll need to install docker and docker compose to run the application as it needs to pull down the mongo image.

You can install docker desktop [Here](https://www.docker.com/products/docker-desktop)

Nodejs 18.14. install node [Here](https://nodejs.org/en/download/)

Make sure you can build native packages.

## Development

Make sure to run `npm install` in the directory.

Ensure to create a `.env` file with the following in it:

```
MONGO_URI=mongodb://database:27017/musicpad
REDIS_URI=redis://cache:6379/0
ACCESS_SECRET=<YourAccessSecret>
REFRESH_SECRET=<YourRefreshSecret>
YT_KEY=<YourYouTubeAPIKey>
```

To run the development application all you have to do is run `docker-compose up --build`

Make sure to make a pull request when commiting.

Make sure to install and the frontend and websocket too!

## Production

you'll want to use k8s to run this in production.
