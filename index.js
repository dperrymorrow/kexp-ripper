"use strict";

const _last = require("lodash.last");
const _kebabCase = require("lodash.kebabcase");
const _uniqBy = require("lodash.uniqby");
const _shuffle = require("lodash.shuffle");
const http = require("http");
// const download = require("download");
const chalk = require("chalk");
const fs = require("fs");
const urlParser = require("url");

const options = {
  host: "feeds.kexp.org",
  port: 80,
  path: "/kexp/songoftheday?format=xml",
  method: "GET",
};

const maxDownloads = 20;
let downloadCount = 0;

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding("utf8");
  res.on("data", chunk => {
    const music = _shuffle(
      _uniqBy(
        chunk
          .split(".mp3")
          .map(seg => seg.split("http://")[1])
          .filter(url => url && url.includes("media.kexp.org"))
          .map(url => ({
            url: `http://${url}.mp3`,
            nameRaw: _last(url.split("/")),
            name: `${_kebabCase(_last(url.split("/")))}.mp3`,
          }))
          .filter(link => link.nameRaw.includes("-")),
        link => link.url
      )
    );

    music.forEach(link => {
      const filePath = `${__dirname}/songs/${link.name}`;
      if (downloadCount < maxDownloads) {
        if (fs.existsSync(filePath)) {
          console.log(chalk.yellow(`already have ${link.name}`));
        } else {
          downloadCount++;
          downloadFile(link.url, filePath);
        }
      }
    });
  });
});

function downloadFile(url, dest) {
  const file = fs.createWriteStream(dest);

  const options = {
    host: urlParser.parse(url).host,
    port: 80,
    path: urlParser.parse(url).pathname,
  };

  http
    .get(options, res => {
      res
        .on("data", data => {
          file.write(data);
        })
        .on("end", () => {
          file.end();
          if (getFileSize(dest) < 1000) {
            fs.unlinkSync(dest);
          } else {
            console.log(chalk.green(_last(dest.split("/"))));
            downloadCount--;
          }
        });
    })
    .on("error", e => {
      console.log(chalk.red(`Got error: ${e.message}`));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
}

function getFileSize(filename) {
  const stats = fs.statSync(filename);
  const fileSizeInBytes = stats.size;
  return fileSizeInBytes;
}

req.on("error", e => {
  console.log(chalk.red(`problem with request: ${e.message}`));
});

req.end();
