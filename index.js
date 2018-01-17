"use strict";

const _last = require("lodash.last");
const _kebabCase = require("lodash.kebabcase");
const http = require("http");
const download = require("download-file");
const chalk = require("chalk");
const fs = require("fs");

const options = {
  host: "feeds.kexp.org",
  port: 80,
  path: "/kexp/songoftheday?format=xml",
  method: "GET",
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding("utf8");
  res.on("data", chunk => {
    const music = chunk
      .split(".mp3")
      .map(seg => seg.split("http://")[1])
      .filter(url => url && url.includes("media.kexp.org"))
      .map(url => ({
        url: `http://${url}.mp3`,
        nameRaw: _last(url.split("/")),
        name: `${_kebabCase(_last(url.split("/")))}.mp3`,
      }))
      .filter(link => link.nameRaw.includes("-"));

    music.forEach(link => {
      if (fs.existsSync(`${__dirname}/songs/${link.name}`))
        console.log(chalk.yellow(`already have ${link.name}`));
      else console.log(chalk.red(link.url), chalk.green(link.name));

      download(link.url, { directory: "./songs/", filename: link.name }, err => {
        if (err) console.log(`Error with ${chalk.magenta(link.url)} ${chalk.red.bold(err)}`);
        else console.log(chalk.green(link.name));
      });
    });
  });
});

req.on("error", e => {
  console.log(chalk.red(`problem with request: ${e.message}`));
});

// write data to request body
// req.write("data\n");
// req.write("data\n");
req.end();
