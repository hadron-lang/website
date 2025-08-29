const express = require("express");
const knex = require("knex").default;
const axios = require("axios").default;

const bug_url = "https://discord.com/api/webhooks/1316406115382071316/Y3LKbs-bFmEIaivUSWlAY6617Ma6hFnR7mJIaP51nYa9SP6NQDRE3cc_zguVDnpftKuo";
const feature_url = "https://discord.com/api/webhooks/1316406370593013790/MvrdIRKneFRvtDBP6PoGlfWG2-7OeFKowFGEPUkwTDlYc_1TKoKZghpwqTmfLmkyl2FQ";

const db = knex({
  client: "better-sqlite3",
  connection: {
    filename: "database.sqlite",
  }, useNullAsDefault: true,
});

async function initDatabase() {
  const downloadsExists = await db.schema.hasTable("downloads");

  if (!downloadsExists) {
    await db.schema.createTable("downloads", table => {
      table.string("day");
      table.string("ip");
    });
  }
}

async function main() {
  const app = express();
  initDatabase();

  app.use("/fonts/ubuntu", express.static("website/public/fonts/ubuntu"));

  app.get("/files/*", async (req, res) => {
    console.log(req.path);

    const ip = req.headers["x-real-ip"] ?? req.headers["cf-connecting-ip"] ?? req.headers["x-forwarded-for"] ?? req.ip;
    await db("downloads").insert({ day: new Date().toISOString().slice(0, 10), ip });

    res.sendFile(process.cwd() + "/public" + req.path);
  });

  app.use(express.urlencoded({ extended: true }));
  app.post("/feedback", async (req, res) => {
    try {
      const fields = [];
      if (req.body.email) fields.push({
        name: "Email",
        value: req.body.email
      });
      fields.push({
        name: "Message",
        value: req.body.message
      });

      switch (req.body.type) {
        case "bug": {
          await axios.post(bug_url, {
            embeds: [{
              color: 0xff0000,
              title: req.body.display_name,
              fields
            }]
          });
          break;
        }
        case "feature": {
          await axios.post(feature_url, {
            embeds: [{
              color: 0x7700ff,
              title: req.body.display_name,
              fields
            }]
          });
          break;
        }
      }
    } catch (err) {
      console.log(err);
      res.redirect("/feedback/error/");
    }
    res.redirect("/feedback/success/");
  });

  app.use("/", express.static("public"));

  const server = app.listen(process.env.PORT || 3333, () => {
    console.log(`App listening on port ${server.address().port}`);
  });
}

main();
